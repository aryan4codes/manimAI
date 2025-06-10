import requests
import json

# Test data - simple Manim scene
test_code = '''
from manim import *

class ConceptScene(Scene):
    def construct(self):
        # Create a simple text animation
        text = Text("Hello, World!", font_size=72)
        self.play(Write(text))
        self.wait(1)
'''

# Test the local Flask app
url = "http://localhost:8080/render"
headers = {
    "Authorization": "Bearer lajslfjljalncjnkjlajslghlagag",
    "Content-Type": "application/json"
}
data = {
    "code": test_code
}

try:
    print("Testing Flask app...")
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except requests.exceptions.ConnectionError:
    print("Error: Could not connect to Flask app. Make sure it's running on localhost:8080")
except Exception as e:
    print(f"Error: {e}") 