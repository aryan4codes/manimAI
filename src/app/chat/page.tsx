/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useChat } from 'ai/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageBubble, ToolStatus } from '@/components/chat/MessageBubble';
import { VideoPlayer } from '@/components/chat/VideoPlayer';
import { Send, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    maxSteps: 5,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderMessagePart = (part: any, partIndex: number) => {
    switch (part.type) {
      case 'text':
        return (
          <div key={partIndex} className="whitespace-pre-wrap">
            {part.text}
          </div>
        );

      case 'tool-invocation':
        const toolCall = part.toolInvocation;
        
        if (toolCall.toolName === 'generateVideo') {
          switch (toolCall.state) {
            case 'call':
              return (
                <div key={partIndex} className="my-3">
                  <ToolStatus 
                    status="generating-script" 
                    concept={toolCall.args?.concept}
                  />
                </div>
              );
            
            case 'result':
              const result = toolCall.result;
              
              if (result.success) {
                return (
                  <div key={partIndex} className="my-4 space-y-3">
                    <ToolStatus 
                      status="success" 
                      concept={result.concept}
                    />
                    <VideoPlayer 
                      videoUrl={result.videoUrl}
                      concept={result.concept}
                    />
                  </div>
                );
              } else {
                return (
                  <div key={partIndex} className="my-3">
                    <ToolStatus 
                      status="error" 
                      concept={result.concept}
                      error={result.error}
                    />
                  </div>
                );
              }
          }
        }
        break;

      case 'step-start':
        return partIndex > 0 ? (
          <div key={partIndex} className="my-4">
            <hr className="border-gray-200" />
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            AI Video Generator
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Ask me to create animated videos explaining any concept
          </p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            // Welcome Message
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center max-w-md mx-auto px-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to AI Video Generator
                </h2>
                <p className="text-gray-600 mb-6">
                                     I can create animated educational videos to explain mathematical and scientific concepts. Just tell me what you&apos;d like to learn about!
                </p>
                                 <div className="text-sm text-gray-500 space-y-1">
                   <p>Try asking: &quot;Create a video about the Pythagorean theorem&quot;</p>
                   <p>Or: &quot;Animate how derivatives work in calculus&quot;</p>
                 </div>
              </div>
            </div>
          ) : (
            // Messages List
            <div className="py-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role === 'user' || message.role === 'assistant' ? message.role : 'assistant'}
                  isLoading={isLoading && message.id === messages[messages.length - 1]?.id}
                >
                  {message.parts?.map((part, partIndex) => 
                    renderMessagePart(part, partIndex)
                  )}
                </MessageBubble>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={input}
                placeholder="Ask me to create an animated video..."
                onChange={handleInputChange}
                disabled={isLoading}
                className="pr-12 py-3 text-sm"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          
          {/* Status Message */}
          {isLoading && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Processing your request...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}