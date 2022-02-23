import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    username: {
      type: 'string',
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: 'string',
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: 'string',
      required: true,
    },
    role: {
      type: 'string',
      required: true,
      enum: ['student', 'teacher', 'superAdmin'],
      default: 'student',
    },
    programmeCode: {
      type: 'string',
      trim: true,
      lowercase: true,
    },
    year: {
      type: 'string',
      trim: true,
      lowercase: true,
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

module.exports = model('User', userSchema);
