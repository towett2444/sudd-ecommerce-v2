import mongoose from 'mongoose';

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Add it to server/.env.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log('DB connected');
};

export default connectDB;
