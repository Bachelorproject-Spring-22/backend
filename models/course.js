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
        type: {
          type: 'string',
          required: true,
          default: 'quiz',
          trim: true,
          lowercase: true,
        },
        variant: {
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
    ],
  },
  { timestamps: true },
);

export default model('Course', courseSchema);
