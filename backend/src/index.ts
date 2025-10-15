import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './db';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chats';

dotenv.config();

// fail fast if required env vars are missing
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is required');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);

async function start() {
  try {
    await connectDB(process.env.MONGO_URI || '');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

// global error handler
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception', err);
  process.exit(1);
});
