import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const courseSchema = new Schema(
  {
    code: {
      type: 'string',
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    credits: {
      type: 'string',
      required: true,
    },
    activities: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Activity',
      },
    ],
    semester: {
      ref: 'Semester',
      required: true,
    },
    studyPlanCodes: {
      type: 'array',
    },
  },
  { timestamps: true },
);

export default model('Course', courseSchema);
