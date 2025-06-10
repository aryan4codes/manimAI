import { NextResponse } from 'next/server';

// This is the URL of your deployed Manim Rendering Service
const RENDERER_URL = process.env.MANIM_RENDERER_URL!; 

export async function POST(req: Request) {
  try {
    const { manimCode } = await req.json();

    // Validate input
    if (!manimCode) {
      return NextResponse.json({ error: 'No manimCode provided' }, { status: 400 });
    }

    // Validate that the code contains required elements
    if (!manimCode.includes('from manim import *')) {
      return NextResponse.json({ error: 'Invalid Manim code: missing required imports' }, { status: 400 });
    }

    if (!manimCode.includes('class ConceptScene(Scene)')) {
      return NextResponse.json({ error: 'Invalid Manim code: missing ConceptScene class' }, { status: 400 });
    }

    if (!manimCode.includes('def construct(self)')) {
      return NextResponse.json({ error: 'Invalid Manim code: missing construct method' }, { status: 400 });
    }

    console.log('Sending Manim code to renderer:', RENDERER_URL);

    // Call the external worker service with timeout
    const rendererResponse = await fetch(RENDERER_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            // Add a secret key to secure your worker endpoint
            'Authorization': `Bearer ${process.env.WORKER_AUTH_TOKEN}`
        },
        body: JSON.stringify({ code: manimCode }),
        // 5 minute timeout for rendering
        signal: AbortSignal.timeout(300000)
    });
    
    if (!rendererResponse.ok) {
        const errorBody = await rendererResponse.text();
        console.error("Renderer service failed:", errorBody);
        
        // Return specific error messages based on status
        if (rendererResponse.status === 401) {
          return NextResponse.json({ error: 'Authentication failed with rendering service' }, { status: 500 });
        } else if (rendererResponse.status === 500) {
          return NextResponse.json({ error: 'Manim rendering failed. Please check your animation code.' }, { status: 500 });
        }
        
        throw new Error(`Video rendering service failed with status ${rendererResponse.status}.`);
    }

    // The worker service will do the heavy lifting and return the final video URL
    const responseData = await rendererResponse.json();
    
    if (!responseData.videoUrl) {
      throw new Error('Rendering service did not return a video URL');
    }

    console.log('Video rendered successfully:', responseData.videoUrl);
    return NextResponse.json({ videoUrl: responseData.videoUrl });

  } catch (error: unknown) {
    console.error('Render video error:', error);
    
    // Handle different error types
    if (error instanceof Error) {
      // Handle timeout errors specifically
      if (error.name === 'TimeoutError') {
        return NextResponse.json({ 
          error: 'Video rendering timed out. Your animation might be too complex or the service is overloaded.' 
        }, { status: 504 });
      }
      
      // Handle fetch errors
      if ('code' in error && error.code === 'ECONNREFUSED') {
        return NextResponse.json({ 
          error: 'Cannot connect to rendering service. Please try again later.' 
        }, { status: 503 });
      }

      return NextResponse.json({ 
        error: error.message || 'An unexpected error occurred during video rendering' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'An unexpected error occurred during video rendering' 
    }, { status: 500 });
  }
}