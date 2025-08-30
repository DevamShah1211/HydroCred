import mongoose from 'mongoose';
import { config } from '../config/env';

let isConnected = false;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }
  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    console.warn('MONGODB_URI not set. Database features will be disabled.');
    return mongoose;
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'hydrocred',
  } as any);
  isConnected = true;
  console.log('✅ Connected to MongoDB');
  return mongoose;
}

