import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  children: ReactNode;
  isLoading?: boolean;
  avatar?: ReactNode;
}

export function MessageBubble({ role, children, isLoading, avatar }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn(
      "flex gap-3 max-w-4xl mx-auto px-4 py-6",
      isUser ? "justify-end" : "justify-start"
    )}>
      {/* Avatar - shown on left for assistant */}
      {!isUser && (
        <div className="flex-shrink-0">
          {avatar || (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col gap-2 max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message Bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm",
          isUser 
            ? "bg-blue-600 text-white rounded-br-md" 
            : "bg-white border border-gray-200 rounded-bl-md"
        )}>
          <div className={cn(
            "text-sm leading-relaxed",
            isUser ? "text-white" : "text-gray-800"
          )}>
            {children}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && !isUser && (
          <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Avatar - shown on right for user */}
      {isUser && (
        <div className="flex-shrink-0">
          {avatar || (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Tool Status Component for showing video generation progress
interface ToolStatusProps {
  status: 'generating-script' | 'rendering-video' | 'success' | 'error';
  concept?: string;
  error?: string;
}

export function ToolStatus({ status, concept, error }: ToolStatusProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'generating-script':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
          text: 'Generating animation script...',
          description: `Creating Manim code for "${concept}"`,
          bgColor: 'bg-blue-50 border-blue-200'
        };
      case 'rendering-video':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin text-purple-500" />,
          text: 'Rendering video...',
          description: 'This may take 1-2 minutes',
          bgColor: 'bg-purple-50 border-purple-200'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          text: 'Video generated successfully!',
          description: `Animation for "${concept}" is ready`,
          bgColor: 'bg-green-50 border-green-200'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
          text: 'Failed to generate video',
          description: error || 'An unexpected error occurred',
          bgColor: 'bg-red-50 border-red-200'
        };
    }
  };

  const { icon, text, description, bgColor } = getStatusInfo();

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border-2",
      bgColor
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{text}</p>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
} 