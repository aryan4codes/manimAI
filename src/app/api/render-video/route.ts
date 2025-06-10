import { NextResponse } from 'next/server';

// This is the URL of your deployed Manim Rendering Service
const RENDERER_URL = process.env.MANIM_RENDERER_URL!; 

export async function POST(req: Request) {
  try {
    const { manimCode } = await req.json();

    if (!manimCode) {
      return NextResponse.json({ error: 'No manimCode provided' }, { status: 400 });
    }

    // Call the external worker service
    const rendererResponse = await fetch(RENDERER_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            // Add a secret key to secure your worker endpoint
            'Authorization': `Bearer ${process.env.WORKER_AUTH_TOKEN}`
        },
        body: JSON.stringify({ code: manimCode })
    });
    
    if (!rendererResponse.ok) {
        const errorBody = await rendererResponse.text();
        console.error("Renderer service failed:", errorBody);
        throw new Error(`Video rendering service failed with status ${rendererResponse.status}.`);
    }

    // The worker service will do the heavy lifting and return the final video URL
    const { videoUrl } = await rendererResponse.json();

    return NextResponse.json({ videoUrl });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}