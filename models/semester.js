import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const semesterSchema = new Schema(
  {
    year: {
      type: 'string',
      trim: true,
      lowercase: true,
      required: true,
    },
    periodNumber: {
      type: 'number',
      trim: true,
      required: true,
      min: 1,
      max: 6,
    },
    type: {
      enum: ['fall', ['spring']],
      required: true,
    },
    courseGroups: {
      type: 'array',
      ref: 'Course',
    },
  },
  { timestamps: true },
);

export default model('Semester', semesterSchema);