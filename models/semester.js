import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const semesterSchema = new Schema(
  {
    periodNumber: {
      type: 'number',
      trim: true,
      required: true,
      min: 1,
      max: 6,
    },
    courseGroups: {
      type: 'array',
      ref: 'Course',
    },
  },
  { timestamps: true },
);

export default model('Semester', semesterSchema);
