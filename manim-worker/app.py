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

    # 3. Save the code to a temporary file
    script_filename = f"/tmp/scene_{uuid.uuid4()}.py"
    with open(script_filename, 'w') as f:
        f.write(python_code)

    # 4. Execute Manim
    # We use -ql for low quality to render fast.
    # The output path is something like 'media/videos/scene/480p15/ConceptScene.mp4'
    # We assume the scene class is named 'ConceptScene'
    try:
        # Note: Manim may output to stderr even on success, so we capture it.
        result = subprocess.run(
            ['manim', '-ql', script_filename, 'ConceptScene'],
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
    # Manim saves the file at a predictable path based on quality and class name
    video_path = 'media/videos/scene/480p15/ConceptScene.mp4'
    blob_filename = f"videos/{uuid.uuid4()}.mp4"

    try:
        with open(video_path, 'rb') as f:
            blob_result = put(blob_filename, f.read(), access='public')
        
        # 6. Return the public URL of the video
        return jsonify({"videoUrl": blob_result['url']})

    except FileNotFoundError:
        return jsonify({"error": "Rendered video file not found."}), 500
    finally:
        # Clean up temporary files
        if os.path.exists(script_filename):
            os.remove(script_filename)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv("PORT", 8080)))