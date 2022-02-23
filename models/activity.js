import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const activitySchema = new Schema(
  {
    name: {
      type: 'string',
      required: true,
    },
    type: {
      type: 'string',
      required: true,
    },
    sources: {
      type: 'array',
      ref: 'Kahoot',
    },
  },
  { timestamps: true },
);

export default model('Activity', activitySchema);
