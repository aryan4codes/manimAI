import requests
import json

# Test data - simple Manim scene
test_code = '''
from manim import *

class ConceptScene(Scene):
    def construct(self):
        # Create a simple text animation
        text = Text("Hello from Production!", font_size=72)
        self.play(Write(text))
        self.wait(1)
'''

# Test the production Flask app (replace with your actual Render URL)
url = "https://your-service-name.onrender.com/render"
headers = {
    "Authorization": "Bearer lajslfjljalncjnkjlajslghlagag",
    "Content-Type": "application/json"
}
data = {
    "code": test_code
}

try:
    print("Testing production Flask app...")
    response = requests.post(url, headers=headers, json=data, timeout=300)  # 5 min timeout
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        video_url = response.json().get('videoUrl')
        print(f"✅ Success! Video URL: {video_url}")
    else:
        print("❌ Error occurred")
        
except requests.exceptions.Timeout:
    print("⏰ Request timed out (this is normal for first request - cold start)")
except Exception as e:
    print(f"Error: {e}") 