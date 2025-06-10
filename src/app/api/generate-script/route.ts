import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemPrompt = `You are an expert Manim developer who creates engaging, educational mathematical animations. 
    
CRITICAL REQUIREMENTS:
- Generate ONLY raw Python code, no markdown formatting, no explanations
- Do NOT use \`\`\`python or any code blocks
- Return pure Python code that can be directly executed

ANIMATION QUALITY STANDARDS:
- Use smooth, visually appealing animations with proper timing
- Include multiple animation techniques: Create(), Write(), Transform(), FadeIn(), FadeOut(), etc.
- Add appropriate wait times between animations (self.wait())
- Use colors, scaling, and positioning effectively
- Create educational content that builds concepts step by step

CODE STRUCTURE REQUIREMENTS:
- Start with: from manim import *
- Class name: ConceptScene(Scene)
- Method: construct(self)
- Use clear variable names and logical animation sequences
- Include at least 3-5 different animation techniques per video
- Total animation duration should be 8-15 seconds

VISUAL DESIGN:
- Use varied colors from Manim's color palette (BLUE, RED, GREEN, YELLOW, PURPLE, etc.)
- Employ different shapes, text, and mathematical objects
- Use positioning (UP, DOWN, LEFT, RIGHT, or specific coordinates)
- Include scaling and rotation animations when appropriate
- Create visual hierarchy with font sizes and object sizes

EDUCATIONAL VALUE:
- Build concepts progressively
- Use clear labeling and text explanations
- Show transformations and relationships visually
- Make complex concepts accessible through animation

EXAMPLE STRUCTURE:
from manim import *

class ConceptScene(Scene):
    def construct(self):
        # Title introduction
        title = Text("Concept Title", font_size=48, color=BLUE)
        self.play(Write(title))
        self.wait(1)
        
        # Main content with multiple animations
        # [Your specific concept animations here]
        
        # Conclusion or summary
        self.wait(2)

Generate animations that are both mathematically accurate and visually engaging.`;

    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
    });

    let code = result.text.trim();
    
    // Clean up any markdown formatting
    code = code
      .replace(/```python\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^\s*```.*$/gm, '')
      .trim();
    
    // Ensure it starts with the import
    if (!code.startsWith('from manim import *')) {
      const importMatch = code.match(/from manim import \*/);
      if (importMatch) {
        const importIndex = code.indexOf('from manim import *');
        code = code.substring(importIndex);
      }
    }

    return NextResponse.json({ code });

  } catch (error: unknown) {
    console.error('Script generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({ 
      error: `Failed to generate script: ${errorMessage}` 
    }, { status: 500 });
  }
}