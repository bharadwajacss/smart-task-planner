import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, MessageSquarePlus, Trash2 } from 'lucide-react';
import { ChatSession } from '@/lib/chatStorage';

interface SidebarProps {
  userName: string;
  chats: ChatSession[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onLogout: () => void;
}

export const Sidebar = ({
  userName,
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onLogout,
}: SidebarProps) => {
  const [width, setWidth] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('smt-sidebar-width');
      return raw ? Number(raw) : 256;
    } catch (e) {
      return 256;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('smt-sidebar-width', String(width));
    } catch (e) {
      // ignore
    }
  }, [width]);

  // Resizer handlers
  const resizingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(width);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const dx = e.clientX - startXRef.current;
      const newWidth = Math.min(600, Math.max(120, startWidthRef.current + dx));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      resizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseleave', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseleave', onMouseUp);
    };
  }, []);

  const onResizerMouseDown = (e: React.MouseEvent) => {
    resizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  const onResizerTouchStart = (e: React.TouchEvent) => {
    resizingRef.current = true;
    startXRef.current = e.touches[0].clientX;
    startWidthRef.current = width;
    document.body.style.userSelect = 'none';
  };

  const onResizerTouchMove = (e: React.TouchEvent) => {
    if (!resizingRef.current) return;
    const dx = e.touches[0].clientX - startXRef.current;
    const newWidth = Math.min(600, Math.max(120, startWidthRef.current + dx));
    setWidth(newWidth);
  };

  const onResizerTouchEnd = () => {
    resizingRef.current = false;
    document.body.style.userSelect = '';
  };

  return (
  <div style={{ width }} className={`border-r bg-muted/30 flex flex-col transition-all duration-150 relative z-40 ml-2`}> 
  <div className="p-4 border-b">
        <div className="mb-2">
          <Button onClick={onNewChat} className={`w-full gap-2`} size="sm">
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

  <ScrollArea className="flex-1 pt-3 pb-3 pl-4 pr-3">
        <div className="space-y-3">
          {chats.map((chat) => (
            <div key={chat.id} className="relative group">
              <div
                onClick={() => onSelectChat(chat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectChat(chat.id); }}
                className={`w-full cursor-pointer py-2 pl-4 pr-3 rounded-lg backdrop-blur-sm transition-transform duration-150 flex items-center justify-between gap-3 ${
                  currentChatId === chat.id
                    ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-2xl'
                    : 'bg-white/80 dark:bg-slate-800/60 text-default shadow-md hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-primary/20'
                }`}
              >
                <div className="flex-1 min-w-0 pr-10">
                  <div className="font-medium truncate">{chat.messages[0]?.content.slice(0, 24) || 'New conversation'}</div>
                  <div className={`text-xs ${currentChatId === chat.id ? 'text-white/80' : 'text-muted-foreground'}`}>{new Date(chat.updatedAt).toLocaleDateString()}</div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  aria-label={`Delete chat ${chat.id}`}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded z-30 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-destructive"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

  <div className="p-2 border-t text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          <div>Logged in as {userName}</div>
        </div>

        <div className="flex items-center gap-2">
          {/* empty placeholder kept intentionally so layout stays consistent */}
        </div>
      </div>
      {/* Resizer bar - absolutely positioned on the right edge */}
      <div
        onMouseDown={onResizerMouseDown}
        onTouchStart={onResizerTouchStart}
        onTouchMove={onResizerTouchMove}
        onTouchEnd={onResizerTouchEnd}
        className="absolute right-0 top-0 h-full w-1 cursor-ew-resize z-50"
        aria-hidden
      />
    </div>
  );
};
