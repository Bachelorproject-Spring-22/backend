import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const activitySchema = new Schema(
  {
    name: {
      type: 'string',
      required: true,
      default: 'quiz',
      trim: true,
      lowercase: true,
    },
    type: {
      type: 'string',
      required: true,
      default: 'kahoot',
      lowercase: true,
      trim: true,
    },
    sources: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Kahoot',
      },
    ],
  },
  { timestamps: true },
);

export default model('Activity', activitySchema);
