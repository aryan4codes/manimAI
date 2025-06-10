import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemPrompt = `You are an expert in Manim, the mathematical animation engine for Python. 
  Your task is to generate a complete, self-contained Python script that creates a short, educational video explaining the user's prompt.
  - The script must use the 'manim' library.
  - Always use animations in the script.
  - It must define a single Scene class, for example, 'class ConceptScene(Scene):'.
  - The final rendered video file should be named 'media/videos/scene/1080p60/ConceptScene.mp4' by Manim's default output structure when using '-ql' for low quality.
  - Ensure all necessary imports are included (from manim import *).
  - The code should be clean, well-commented, and directly executable with 'manim -ql your_script_name.py ConceptScene'.
  - Do NOT include any explanations, markdown formatting, or anything other than the raw Python code.
  - The code should be in the following format:
  \`\`\`python
  from manim import *
  class ConceptScene(Scene):
      def construct(self):
          pass\`\`\`
  `;

  const response = await streamText({
    model: google('gemini-2.0-flash-exp'),
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ],
  });

  return response.toDataStreamResponse();
}