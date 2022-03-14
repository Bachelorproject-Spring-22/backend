import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const courseSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    courseId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
    },
    activities: [
      {
        name: {
          type: String,
          required: true,
          default: 'quiz',
          trim: true,
          lowercase: true,
        },
        variant: {
          type: String,
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
