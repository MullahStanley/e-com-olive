import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Augment the global scope to include our cache object
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// Retrieve the cached connection, or initialize it if it's the first run
let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  // 1. If we already have a connection, return it immediately
  if (cached.conn) {
    return cached.conn;
  }

  // 2. If a connection is not already in progress, start one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Fail fast if DB is down instead of hanging
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('✅ MongoDB connected successfully');
      return mongooseInstance;
    });
  }

  // 3. Await the promise and handle potential errors
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset the promise so the next request can try again
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
