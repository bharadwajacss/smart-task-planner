import mongoose from 'mongoose';

export async function connectDB(uri: string) {
  if (!uri) throw new Error('MONGO_URI is required');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}
