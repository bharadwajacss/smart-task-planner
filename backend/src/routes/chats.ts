import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { auth } from '../middleware/auth';
import { Chat } from '../models/Chat';

const router = express.Router();

// List chats for user
router.get('/', auth, async (req: Request, res: Response) => {
  const user = req.user;
  const chats = await Chat.find({ userId: user._id }).sort({ updatedAt: -1 });
  res.json(chats);
});

// Create new chat
router.post('/', auth, async (req: Request, res: Response) => {
  const user = req.user;
  const chat = await Chat.create({ userId: user._id, messages: [] });
  res.json(chat);
});

// Get messages
router.get('/:chatId/messages', auth, async (req: Request, res: Response) => {
  const { chatId } = req.params;
  if (!chatId || !mongoose.isValidObjectId(chatId)) {
    console.warn('Invalid chatId received', { chatId, url: req.originalUrl, ip: req.ip });
    return res.status(400).json({ message: 'Invalid chatId' });
  }
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  if (chat.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
  res.json(chat.messages || []);
});

// Add message
router.post('/:chatId/messages', auth, async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { role, content } = req.body;
  if (!chatId || !mongoose.isValidObjectId(chatId)) {
    console.warn('Invalid chatId received', { chatId, url: req.originalUrl, ip: req.ip });
    return res.status(400).json({ message: 'Invalid chatId' });
  }
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  if (chat.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

  const msg = { role, content, timestamp: new Date() };
  chat.messages.push(msg as any);
  chat.updatedAt = new Date();
  await chat.save();
  res.json(msg);
});

// Delete chat
router.delete('/:chatId', auth, async (req: Request, res: Response) => {
  const { chatId } = req.params;
  if (!chatId || !mongoose.isValidObjectId(chatId)) {
    console.warn('Invalid chatId received', { chatId, url: req.originalUrl, ip: req.ip });
    return res.status(400).json({ message: 'Invalid chatId' });
  }
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  if (chat.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
  await chat.deleteOne();
  res.json({ success: true });
});

export default router;
