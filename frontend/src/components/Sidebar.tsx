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
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-xl">✓</span>
          </div>
          <div>
            <h2 className="font-bold text-sm">Smart Task Planner</h2>
            <p className="text-xs text-muted-foreground">{userName}</p>
          </div>
        </div>
        <Button onClick={onNewChat} className="w-full gap-2" size="sm">
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {chats.map((chat) => (
            <div key={chat.id} className="group relative">
              <button
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentChatId === chat.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="truncate">
                  {chat.messages[0]?.content.slice(0, 30) || 'New conversation'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(chat.updatedAt).toLocaleDateString()}
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t text-xs text-muted-foreground">
        Logged in as {userName}
      </div>
    </div>
  );
};
