import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const courseSchema = new Schema(
  {
    code: {
      type: 'string',
      required: true,
    },
    courseId: {
      type: 'string',
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    credits: {
      type: 'number',
      required: true,
    },
    activities: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Activity',
      },
    ],
  },
  { timestamps: true },
);

export default model('Course', courseSchema);
