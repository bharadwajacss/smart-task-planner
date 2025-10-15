import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Send, Loader2 } from 'lucide-react';
import { Message } from '@/lib/chatStorage';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  onGeneratePlan?: (goal: string) => Promise<void>;
  focusSignal?: number;
}

export const ChatInterface = ({ messages, onSendMessage, isLoading, onGeneratePlan, focusSignal }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Focus when parent requests (incrementing signal)
  useEffect(() => {
    if (typeof focusSignal !== 'undefined' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [focusSignal]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    if (inputRef.current) inputRef.current.focus();
    await onSendMessage(message);
  };

  const handleGenerateClick = async () => {
    if (!input.trim() || isLoading) return;
    const goal = input.trim();
    setInput('');
    if (inputRef.current) inputRef.current.focus();
    if (onGeneratePlan) await onGeneratePlan(goal);
  };

  return (
    <Card className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-6 py-6" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Start Your Planning Journey</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Tell me about your goal, and I'll help you break it down into actionable tasks with timelines and dependencies.
              </p>
            </div>
          ) : (
            messages.map((message, idx) => (
              <div
                key={message.id ?? `msg-${idx}`}
                className={`flex w-full px-6 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground mr-3'
                      : 'bg-muted ml-3'
                  }`}
                  style={{
                    // Keep bubbles responsive: max width is percentage of available width
                    maxWidth: '80%',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
                  ) : (
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1" style={{ overflowWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your goal or ask for help..."
            disabled={isLoading}
            className="flex-1"
            autoFocus
          />
          {/* Generate PDF button: uses current input as goal */}
          <Button type="button" onClick={handleGenerateClick} disabled={isLoading || !input.trim()} size="sm" className="px-3">
            Generate PDF
          </Button>
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};
