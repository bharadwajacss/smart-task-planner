export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}
import { authService } from './auth';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function authHeaders() {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const chatStorage = {
  getUserChats: async (userId: string): Promise<ChatSession[]> => {
    const res = await fetch(`${BACKEND}/api/chats`, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error('Failed to fetch chats');
    const data: any[] = await res.json();
    return data.map((c) => ({
      id: c._id?.toString() ?? c.id,
      userId: c.userId?.toString() ?? c.userId ?? '',
      messages: c.messages ?? [],
      createdAt: c.createdAt ?? '',
      updatedAt: c.updatedAt ?? '',
    } as ChatSession));
  },

  createChat: async (userId: string): Promise<ChatSession> => {
    const res = await fetch(`${BACKEND}/api/chats`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() } });
    if (!res.ok) throw new Error('Failed to create chat');
    const c: any = await res.json();
    return {
      id: c._id?.toString() ?? c.id,
      userId: c.userId?.toString() ?? c.userId ?? '',
      messages: c.messages ?? [],
      createdAt: c.createdAt ?? '',
      updatedAt: c.updatedAt ?? '',
    } as ChatSession;
  },

  addMessage: async (chatId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> => {
    if (!chatId) throw new Error('chatId is required');
    const res = await fetch(`${BACKEND}/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(message),
    });
    if (!res.ok) throw new Error('Failed to add message');
    return res.json();
  },

  getChat: async (chatId: string): Promise<ChatSession | null> => {
    if (!chatId) throw new Error('chatId is required');
    const res = await fetch(`${BACKEND}/api/chats/${chatId}/messages`, { headers: { ...authHeaders() } });
    if (!res.ok) return null;
    const messages = await res.json();
    return { id: chatId, userId: '', messages, createdAt: '', updatedAt: '' } as ChatSession;
  },

  deleteChat: async (chatId: string): Promise<void> => {
    if (!chatId) throw new Error('chatId is required');
    const res = await fetch(`${BACKEND}/api/chats/${chatId}`, { method: 'DELETE', headers: { ...authHeaders() } });
    if (!res.ok) throw new Error('Failed to delete chat');
  },
};
