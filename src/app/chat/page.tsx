'use client';

import { useChat } from 'ai/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Chat() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { input, handleInputChange, handleSubmit } = useChat({
    api: '/api/generate-script',
    onFinish: async (message) => {
      console.log("Manim script generation finished. Content:", message.content);
      setVideoUrl(null); // Clear previous video

      toast.info("Script generated! Now rendering the video...");

      try {
        const response = await fetch('/api/render-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manimCode: message.content })
        });

        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.error || "The render service returned an error.");
        }
        
        const { videoUrl: finalUrl } = await response.json();
        
        setVideoUrl(finalUrl);
        toast.success("Video Ready!", {
          description: "Your animated explanation is ready to watch.",
        });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        toast.error("Uh oh! Something went wrong.", {
          description: err.message || "Failed to render the video.",
        });
      } finally {
        setIsGenerating(false);
      }
    },
    // We can also handle the initial API call error here
    onError: (err) => {
      toast.error("Failed to generate script.", {
        description: err.message,
      });
      setIsGenerating(false);
    }
  });

  // Custom handler to manage loading state
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    setVideoUrl(null);
    toast("Generating Manim script...", {
      description: "Please wait while the AI works its magic.",
    });
    handleSubmit(e); // Call the original Vercel AI SDK handler
  }

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Text to Animated Video</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit}>
            <div className="flex gap-2">
              <Input
                value={input}
                placeholder="Explain a concept, like 'Pythagoras Theorem'"
                onChange={handleInputChange}
                disabled={isGenerating}
              />
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </form>
          <div className="mt-8">
            {isGenerating && !videoUrl && (
              <div className="text-center p-4 border-dashed border-2 rounded-lg">
                <p>⚙️ Generating Manim script and rendering video... this may take a minute.</p>
                {/* You can add a spinner here */}
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