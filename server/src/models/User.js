import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: 
    { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    email: 
    {
       type: String, 
       required: true, 
       unique: true, 
       lowercase: true, 
       trim: true 
      },
    passwordHash: 
    { 
      type: String, 
      required: true 
    },
    avatar: 
    { 
      type: String 
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
