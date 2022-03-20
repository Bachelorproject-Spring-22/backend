import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['student', 'teacher', 'superAdmin'],
      default: 'student',
    },
    programmeCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    year: {
      type: Number,
      trim: true,
    },
  },
  { timestamps: true },
);
userSchema.virtual('isVerified').get(function () {
  return !!(this.verified || this.passwordReset);
});

userSchema.set('toJson', {
  virtual: true,
  versionKey: false,
  transform(doc, ret) {
    // Removes _id and password field
    delete ret._id;
    delete ret.password;
  },
});

export default model('User', userSchema);
