import os
import subprocess
import uuid
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from vercel_blob import put

load_dotenv()

app = Flask(__name__)

# A simple secret to protect the endpoint
AUTH_TOKEN = os.getenv("WORKER_AUTH_TOKEN")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "manim-worker"}), 200

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "manim-worker"}), 200
# Vercel Blob token, set in your hosting environment
os.environ["BLOB_READ_WRITE_TOKEN"] = os.getenv("BLOB_READ_WRITE_TOKEN") 

@app.route('/render', methods=['POST'])
def render_video():
    # 1. Authenticate the request
    auth_header = request.headers.get('Authorization')
    if not auth_header or auth_header.split(" ")[1] != AUTH_TOKEN:
        return jsonify({"error": "Unauthorized"}), 401

    # 2. Get the Python code from the request
    data = request.get_json()
    python_code = data.get('code')
    if not python_code:
        return jsonify({"error": "No code provided"}), 400

    # 3. Save the code to a temporary file and extract class name
    script_filename = f"/tmp/scene_{uuid.uuid4()}.py"
    with open(script_filename, 'w') as f:
        f.write(python_code)
    
    # Extract the Scene class name from the code
    import re
    class_match = re.search(r'class\s+(\w+)\s*\(\s*Scene\s*\):', python_code)
    if not class_match:
        return jsonify({"error": "No Scene class found in the code"}), 400
    
    scene_class_name = class_match.group(1)
    print(f"Found Scene class: {scene_class_name}")

    # 4. Execute Manim
    # We use -ql for low quality to render fast.
    # The output path is something like 'media/videos/scene/480p15/ConceptScene.mp4'
    # We assume the scene class is named 'ConceptScene'
    try:
        # Note: Manim may output to stderr even on success, so we capture it.
        result = subprocess.run(
            # high quality
            ['manim', '-ql', script_filename, scene_class_name],
            capture_output=True,
            text=True,
            check=True, # This will raise an exception if Manim returns a non-zero exit code
            timeout=180 # 3-minute timeout
        )
        print("Manim STDOUT:", result.stdout)
        print("Manim STDERR:", result.stderr)
        
    except subprocess.CalledProcessError as e:
        print("Manim execution failed!")
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr)
        return jsonify({"error": "Manim execution failed", "details": e.stderr}), 500
    except subprocess.TimeoutExpired as e:
        return jsonify({"error": "Manim rendering timed out"}), 500

    # 5. Upload the result to Vercel Blob
    # Find the actual video file - Manim creates a unique folder name
    import glob
    video_pattern = f'media/videos/*/*/{scene_class_name}.mp4'
    video_files = glob.glob(video_pattern)
    
    if not video_files:
        return jsonify({"error": "Rendered video file not found."}), 500
    
    video_path = video_files[0]  # Take the first (should be only) match
    blob_filename = f"videos/{uuid.uuid4()}.mp4"

    try:
        with open(video_path, 'rb') as f:
            blob_result = put(blob_filename, f.read())
        
        # 6. Return the public URL of the video
        return jsonify({"videoUrl": blob_result['url']})

    except FileNotFoundError:
        return jsonify({"error": "Rendered video file not found."}), 500
    finally:
        # Clean up temporary files
        if os.path.exists(script_filename):
            os.remove(script_filename)
        # Clean up media folder
        import shutil
        if os.path.exists('media'):
            shutil.rmtree('media')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv("PORT", 8080)), debug=True)