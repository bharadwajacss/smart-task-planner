import { useState, useRef, useEffect, useMemo } from 'react';
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
  const userScrolledRef = useRef(false);
  const inputCardRef = useRef<HTMLDivElement | null>(null);
  const [inputHeight, setInputHeight] = useState<number>(56);

  // Auto-scroll behavior: only jump to bottom when user is near bottom or a new assistant message arrives
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;

    // If user has scrolled up and is not near bottom, don't auto-scroll on user messages
    const lastMsg = messages[messages.length - 1];
    const lastIsAssistant = lastMsg?.role === 'assistant';

    if (isNearBottom || lastIsAssistant) {
      el.scrollTop = el.scrollHeight;
      userScrolledRef.current = false;
    }
  }, [messages]);

  // Track user manual scrolls to prevent aggressive auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      userScrolledRef.current = !isNearBottom;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Measure floating input height and update spacer so padding equals input height
  useEffect(() => {
    const el = inputCardRef.current;
    if (!el) return;

    const measure = () => setInputHeight(Math.ceil(el.getBoundingClientRect().height));

    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }

    const onWin = () => measure();
    window.addEventListener('resize', onWin);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onWin);
    };
  }, [inputCardRef.current]);

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

  // Group messages by consecutive sender to render compact timestamps and grouped bubbles
  const grouped = useMemo(() => {
    const groups: Array<{ role: 'user' | 'assistant'; messages: Message[] }> = [];
    for (const msg of messages) {
      const last = groups[groups.length - 1];
      if (!last || last.role !== msg.role) {
        groups.push({ role: msg.role, messages: [msg] });
      } else {
        last.messages.push(msg);
      }
    }
    return groups;
  }, [messages]);

  return (
  <Card className="flex flex-col h-full shadow-lg ring-1 ring-black/5 rounded-lg">
      <ScrollArea className="flex-1 px-4 pt-4 pb-0" ref={scrollRef}>
        <div className="flex flex-col gap-4">
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
            // Render grouped messages
            grouped.map((group, gIdx) => {
              const first = group.messages[0];
              const isUser = group.role === 'user';
              return (
                <div key={`group-${gIdx}-${first.id}`} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${isUser ? 'bg-primary text-primary-foreground mr-3' : 'bg-muted ml-3'}`}
                      style={{ maxWidth: '90%', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', textAlign: isUser ? 'right' as const : 'left' as const }}
                    >
                      {group.messages.map((m) => (
                        <div key={m.id} className="mb-2 last:mb-0">
                          {isUser ? (
                            <p className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{m.content}</p>
                          ) : (
                            <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1" style={{ overflowWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                              <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Timestamps removed per user request */}
                  </div>
                </div>
              );
            })
          )}

          {/* Optimistic assistant placeholder: show when loading and last message is user-sent */}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="text-sm text-muted-foreground">Thinking…</div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Floating card input - sits above the bottom with shadow */}
      <div className="pointer-events-none">
        <div className="relative">
          {/* full-width floating input: align with chat padding and span available width */}
          <div className="absolute left-0 right-0 -bottom-2 pointer-events-auto">
            <div ref={inputCardRef} className="bg-blue-500 border-t border-blue-600 rounded-b-lg shadow-sm p-2">
              <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your goal or ask for help..."
                    disabled={isLoading}
                    className="w-full min-w-0 bg-slate-100 text-slate-900 placeholder-slate-500 border border-black/60"
                  />
                </div>
                <Button type="button" onClick={handleGenerateClick} disabled={isLoading || !input.trim()} size="sm" className="px-3 bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200 disabled:opacity-50">
                  Generate PDF
                </Button>
                <Button type="submit" disabled={isLoading || !input.trim()} size="icon" aria-label="Send message" className="bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200 disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
            {/* spacer equals measured input card height so content isn't hidden */}
            <div style={{ height: inputHeight }} />
        </div>
      </div>
    </Card>
  );
};
