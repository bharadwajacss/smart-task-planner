
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AuthForm } from '@/components/AuthForm';
import { ApiKeySetup } from '@/components/ApiKeySetup';
import { Sidebar } from '@/components/Sidebar';
import Header from '@/components/Header';
import { ChatInterface } from '@/components/ChatInterface';
import { TaskList } from '@/components/TaskList';
import { authService, User } from '@/lib/auth';
import { aiService } from '@/lib/aiService';
import { chatStorage, ChatSession } from '@/lib/chatStorage';
import { Task } from '@/lib/types';
import { exportToPDF } from '@/lib/pdfExport';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goalTitle, setGoalTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [focusSignal, setFocusSignal] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setHasApiKey(aiService.hasApiKey());

    if (currentUser) {
      loadUserChats(currentUser.id);
    }
  }, []);

  // Only create a new chat if user exists and there are no chats
  useEffect(() => {
    // Only create a new chat after we've finished loading existing chats from the server.
    if (user && chatsLoaded && chats.length === 0 && !currentChat) {
      handleNewChat();
    }
  }, [user, chatsLoaded, chats, currentChat]);

  const loadUserChats = async (userId: string) => {
    const userChats = await chatStorage.getUserChats(userId);
    setChats(userChats);
    if (userChats.length > 0) {
      setCurrentChat(userChats[0]);
      // focus input when loading the first chat
      setTimeout(() => setFocusSignal((s) => s + 1), 50);
    }
    setChatsLoaded(true);
  };

  const handleAuthSuccess = () => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    if (currentUser) loadUserChats(currentUser.id);
  };

  const handleApiKeySetup = () => {
    setHasApiKey(true);
    toast({
      title: 'API Key Saved',
      description: 'You can now start using AI features.',
    });
  };

  const handleNewChat = async () => {
    if (!user) return;
    const newChat = await chatStorage.createChat(user.id);
    setChats([newChat, ...chats]);
    setCurrentChat(newChat);
    setTasks([]);
    setGoalTitle('');
    // bump focus signal to tell chat input to focus
    setTimeout(() => setFocusSignal((s) => s + 1), 50);
  };

  const handleSelectChat = async (chatId: string) => {
    const chat = await chatStorage.getChat(chatId);
    if (chat) setCurrentChat(chat);
    // focus input when selecting an existing chat
    setTimeout(() => setFocusSignal((s) => s + 1), 50);
  };

  const handleDeleteChat = async (chatId: string) => {
    await chatStorage.deleteChat(chatId);
    const updatedChats = chats.filter((c) => c.id !== chatId);
    setChats(updatedChats);
    if (currentChat?.id === chatId) {
      setCurrentChat(updatedChats[0] || null);
      setTasks([]);
      setGoalTitle('');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentChat) return;
    try {
      setIsLoading(true);

      // Show the user's message immediately (optimistic)
      const tempMsg = {
        id: `temp-${Date.now()}`,
        role: 'user' as const,
        content,
        createdAt: new Date().toISOString(),
      };

      setCurrentChat((prev) => (prev ? { ...prev, messages: [...prev.messages, tempMsg as any] } : prev));

      // persist
      const userMessage = await chatStorage.addMessage(currentChat.id, { role: 'user', content });

      // Only generate a full task plan if the user explicitly requests it.
      const generationKeywords = /\b(generate plan|generate tasks|create plan|create tasks|new plan|new tasks|regenerate|regenerate tasks|create task plan)\b/i;
      const wantsGeneration = generationKeywords.test(content);

      // Also detect modification/generation intents (used to decide if JSON is allowed)
      const modificationKeywords = /\b(modify|update|change|edit|add|remove|reschedul|deadline|priority|replace|replan|regenerate|generate|create|new plan|new tasks)\b/i;
      const wantsJson = modificationKeywords.test(content) || wantsGeneration;

      const sanitizeModelOutput = (text: string) => {
        // If user explicitly wants JSON (tech request), return as-is
        if (wantsJson) return text;

        // Strip TASK_CONTEXT_JSON: wrapper if present and convert to readable summary
        if (typeof text === 'string' && text.startsWith('TASK_CONTEXT_JSON:')) {
          try {
            const jsonText = text.replace(/^TASK_CONTEXT_JSON:\s*/i, '');
            const parsed = JSON.parse(jsonText);
            const goal = parsed.goalTitle || 'Untitled';
            const lines = [`Task summary for goal: ${goal}`];
            (parsed.tasks || []).forEach((t: any, i: number) => {
              lines.push(`${i + 1}. ${t.title} — ${t.description || ''} ${t.deadline ? `Deadline: ${t.deadline}.` : ''}`);
            });
            return lines.join('\n');
          } catch (e) {
            // fallthrough to raw text
          }
        }

        // If it looks like JSON, try to parse and summarize
        const trimmed = (text || '').trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && parsed.tasks) {
              const goal = parsed.goalTitle || 'Untitled';
              const lines = [`Task summary for goal: ${goal}`];
              (parsed.tasks || []).forEach((t: any, i: number) => {
                lines.push(`${i + 1}. ${t.title} — ${t.description || ''} ${t.deadline ? `Deadline: ${t.deadline}.` : ''}`);
              });
              return lines.join('\n');
            }
            // For other JSON shapes, return a compact stringified version
            return JSON.stringify(parsed, null, 2);
          } catch (e) {
            return text;
          }
        }

        return text;
      };

      if (wantsGeneration) {
        // Explicit generation request: create a structured plan and persist it to chat
        const result = await aiService.generateTaskPlan(content);
        setTasks(result.tasks);
        setGoalTitle(result.goalTitle);

        const assistantMessage = await chatStorage.addMessage(currentChat.id, {
          role: 'assistant',
          content: `I've created a task plan for "${result.goalTitle}" with ${result.tasks.length} tasks.`,
        });

        setCurrentChat((prev) =>
          prev
            ? { ...prev, messages: [...prev.messages.filter(m => !String(m.id).startsWith('temp-')), userMessage, assistantMessage] }
            : prev
        );
      } else {
        const conversationHistory = currentChat.messages.map((m) => ({ role: m.role, content: m.content }));

        const aiResponse = await aiService.chat(content, conversationHistory, { tasks, goalTitle });

        const sanitized = sanitizeModelOutput(aiResponse);

        const assistantMessage = await chatStorage.addMessage(currentChat.id, {
          role: 'assistant',
          content: sanitized,
        });

        setCurrentChat((prev) =>
          prev
            ? { ...prev, messages: [...prev.messages.filter(m => !String(m.id).startsWith('temp-')), userMessage, assistantMessage] }
            : prev
        );
      }

      if (user) loadUserChats(user.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async (goal: string) => {
    if (!currentChat) return;
    try {
      setIsLoading(true);
      const result = await aiService.generateTaskPlan(goal);
      setTasks(result.tasks);
      setGoalTitle(result.goalTitle);
  // show the task panel when a plan is generated
  setShowTaskPanel(true);
      const assistantMessage = await chatStorage.addMessage(currentChat.id, {
        role: 'assistant',
        content: `I've created a task plan for "${result.goalTitle}" with ${result.tasks.length} tasks.`,
      });

      setCurrentChat((prev) =>
        prev
          ? { ...prev, messages: [...prev.messages, assistantMessage] }
          : prev
      );

  // Do not show the task panel automatically. Panel remains hidden unless explicitly toggled.
      try {
        exportToPDF(result.tasks, result.goalTitle);
        toast({ title: 'PDF generated', description: 'Your task plan PDF has been downloaded.' });
      } catch (err) {
        toast({ title: 'Export failed', description: 'Failed to generate PDF. See console for details.', variant: 'destructive' });
        // eslint-disable-next-line no-console
        console.error('exportToPDF error', err);
      }

      if (user) loadUserChats(user.id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('generatePlan error', err);
      // show toast if available
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.signOut();
    setUser(null);
    setChats([]);
    setCurrentChat(null);
    setChatsLoaded(false);
    setTasks([]);
    setGoalTitle('');
  };

  if (!user) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Header userName={user?.name ?? ''} onLogout={() => {}} />
        <div className="flex-1">
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Header userName={user?.name ?? ''} onLogout={handleLogout} />
        <div className="flex-1">
          <ApiKeySetup onComplete={handleApiKeySetup} />
        </div>
      </div>
    );
  }

  if (!currentChat) {
  // Show simple loading state until chat is ready
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <p className="text-lg text-muted-foreground">Loading your chat...</p>
    </div>
  );
}

  return (
    <div className="flex h-screen flex-col bg-background">
  <Header userName={user.name} onLogout={handleLogout} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          userName={user.name}
          chats={chats}
          currentChatId={currentChat?.id || null}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onLogout={handleLogout}
        />

        <div className="flex-1 flex gap-4 p-6 overflow-hidden">
          <div className="flex-1 min-w-0">
            <ChatInterface
              messages={currentChat?.messages || []}
              onSendMessage={handleSendMessage}
              onGeneratePlan={handleGeneratePlan}
              isLoading={isLoading}
              focusSignal={focusSignal}
            />
          </div>

          {(showTaskPanel && tasks.length > 0) && (
            <div className="w-96 overflow-y-auto">
              {tasks.length > 0 ? (
                <TaskList tasks={tasks} goalTitle={goalTitle} />
              ) : (
                <div className="p-4 text-sm text-muted-foreground">
                  <p className="mb-2">No tasks yet. To generate a task plan, send a chat message like:</p>
                  <pre className="bg-muted p-2 rounded">Generate a plan to launch my personal website</pre>
                  <p className="mt-2">Or ask the assistant: <strong>"generate plan"</strong>.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
