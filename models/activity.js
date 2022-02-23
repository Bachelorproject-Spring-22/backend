import { Schema, model } from 'mongoose';

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

module.exports = model('Activity', activitySchema);
