import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-2.0-flash-exp'),
    system: `You are an AI assistant that creates educational animated videos. When a user mentions any educational concept or asks for a video/animation, IMMEDIATELY use the generateVideo tool. Do NOT ask for clarification or more details - just proceed with creating the video based on what they mentioned.

Examples of when to use generateVideo tool:
- "create pythagoras theorem video" → USE TOOL
- "animate calculus" → USE TOOL  
- "show me derivatives" → USE TOOL
- "explain quadratic equations" → USE TOOL
- "pythagorean theorem" → USE TOOL

Be proactive and decisive - create videos immediately when requested.`,
    messages,
    maxSteps: 5,
    tools: {
      // Video generation tool that will be executed server-side
      generateVideo: {
        description: 'IMMEDIATELY generate an educational animated video using Manim when the user requests any video, animation, or visual explanation. Do NOT ask for more details - just create the video based on the concept mentioned. Use this tool whenever the user mentions: "create video", "animate", "show", "explain visually", or any educational concept.',
        parameters: z.object({
          concept: z.string().describe('The mathematical or educational concept to animate and explain (extract from user message)'),
          description: z.string().describe('Auto-generate a comprehensive description of how to animate and explain this concept visually, including step-by-step visual breakdown')
        }),
        execute: async ({ concept, description }: { concept: string; description: string }) => {
          try {
            console.log(`Generating video for concept: ${concept}`);
            
            // Step 1: Generate Manim script
            const scriptResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-script`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: [{
                  role: 'user',
                  content: `Create an animated video explaining: ${concept}. ${description}`
                }]
              })
            });

            if (!scriptResponse.ok) {
              throw new Error('Failed to generate Manim script');
            }

            const { code: scriptContent } = await scriptResponse.json();
            console.log('Generated script content:', scriptContent);
            
            // Validate the script has required elements
            if (!scriptContent.includes('from manim import *')) {
              throw new Error('Generated script missing manim imports');
            }
            if (!scriptContent.includes('(Scene)')) {
              throw new Error('Generated script missing Scene class');
            }
            if (!scriptContent.includes('def construct(self)')) {
              throw new Error('Generated script missing construct method');
            }

            console.log('Generated script, now rendering video...');
            console.log('Script preview:', scriptContent.substring(0, 200) + '...');

            // Step 2: Render video
            const renderResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/render-video`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ manimCode: scriptContent })
            });

            if (!renderResponse.ok) {
              const errorData = await renderResponse.json();
              throw new Error(errorData.error || 'Failed to render video');
            }

            const { videoUrl } = await renderResponse.json();
            
            return {
              success: true,
              videoUrl,
              concept,
              message: `Successfully created an animated video explaining "${concept}"`
            };

          } catch (error: unknown) {
            console.error('Video generation error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            return {
              success: false,
              error: errorMessage,
              concept,
              message: `Failed to create video for "${concept}": ${errorMessage}`
            };
          }
        },
      },
    },
  });

  return result.toDataStreamResponse();
}