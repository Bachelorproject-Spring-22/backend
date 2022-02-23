import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
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

module.exports = mongoose.model('Activity', activitySchema);
