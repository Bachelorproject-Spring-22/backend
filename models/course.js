import { Schema, model } from 'mongoose';

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
    activities: {
      type: 'array',
      ref: 'Activity',
    },
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

module.exports = model('Course', courseSchema);
