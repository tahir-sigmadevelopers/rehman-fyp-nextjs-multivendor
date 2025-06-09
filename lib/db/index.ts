import mongoose from 'mongoose'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cached = (global as any).mongoose || { conn: null, promise: null }

export const connectToDatabase = async (
  MONGODB_URI = "mongodb://admin:_isHacked@ac-3rlel4d-shard-00-00.daqohrw.mongodb.net:27017,ac-3rlel4d-shard-00-01.daqohrw.mongodb.net:27017,ac-3rlel4d-shard-00-02.daqohrw.mongodb.net:27017/amazona?replicaSet=atlas-t5xj5a-shard-0&ssl=true&authSource=admin"
) => {
  if (cached.conn) return cached.conn

  if (!MONGODB_URI) throw new Error('MONGODB_URI is missing')

  // Set mongoose options to be more flexible with schema validation
  mongoose.set('strictQuery', false);
  
  // For Mongoose 6+, these are the correct options
  const options = {
    // No specific options needed - strictQuery is set globally above
  };

  cached.promise = cached.promise || mongoose.connect(MONGODB_URI, options);

  cached.conn = await cached.promise

  return cached.conn
}
