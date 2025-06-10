'use client';

import { useChat } from 'ai/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast"

export default function Label() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const { toast } = useToast()
  // This hook handles the initial call to generate the Manim script
  const { input, handleInputChange, handleSubmit } = useChat({
    // We will create this API route next
    api: '/api/generate-script', 
    onFinish: async (message) => {
        // The AI has returned the generated Manim code.
        // Now we trigger the video rendering process.
        console.log("Manim script generation finished. Content:", message.content);
        setIsLoadingVideo(true);
        setVideoUrl(null);

        try {
            const response = await fetch('/api/render-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ manimCode: message.content })
            });

            const { videoUrl: finalUrl, error } = await response.json();
            
            if (error) {
              throw new Error(error);
            }

            setVideoUrl(finalUrl);
             toast.success("Video Ready!")

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        } catch (err: any) {
             toast.error("Uh oh! Something went wrong.")
        } finally {
            setIsLoadingVideo(false);
        }
    }
  });

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto py-12">
        <Card>
            <CardHeader>
                <CardTitle>Text to Animated Video</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            placeholder="Explain a concept, like 'Pythagoras Theorem'"
                            onChange={handleInputChange}
                        />
                        <Button type="submit" disabled={isLoadingVideo}>Generate</Button>
                    </div>
                </form>
                 <div className="mt-8">
                    {isLoadingVideo && (
                        <div className="text-center p-4 border-dashed border-2 rounded-lg">
                            <p>⚙️ Generating Manim script and rendering video... this may take a minute.</p>
                        </div>
                    )}
                    {videoUrl && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Your Video:</h3>
                            <video controls src={videoUrl} className="w-full rounded-lg" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}