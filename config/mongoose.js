import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
export function connectToMongoDB() {
  try {
    mongoose.connect(process.env.MONGODB_CONNECTION_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to Database');
  } catch (error) {
    console.error(error || 'Error connecting to DB');
    process.exit(1);
  }
}

export default mongoose;
