import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoPlayerProps {
  videoUrl: string;
  concept: string;
  onDownload?: () => void;
}

export function VideoPlayer({ videoUrl, concept, onDownload }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Animated Explanation: ${concept}`,
          text: `Check out this animated explanation of ${concept}`,
          url: videoUrl,
        });
      } else {
        await navigator.clipboard.writeText(videoUrl);
        toast.success('Video URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share video');
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `${concept.replace(/\s+/g, '_')}_animation.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (onDownload) onDownload();
    toast.success('Video download started!');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
      <CardContent className="p-0">
        {/* Video Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            🎬 Animated Explanation
          </h3>
          <p className="text-blue-100 text-sm mt-1">{concept}</p>
        </div>

        {/* Video Container */}
        <div className="relative">
          <video
            src={videoUrl}
            controls
            className="w-full aspect-video bg-black"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
          
          {/* Video Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Video Controls */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-blue-600" />
                ) : (
                  <Play className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-sm text-gray-600 font-medium">
                  {isPlaying ? 'Playing' : 'Ready to play'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-1 hover:bg-blue-50"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-1 hover:bg-purple-50"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="px-4 pb-4">
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mt-2">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Generated with Manim • Educational Animation
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 