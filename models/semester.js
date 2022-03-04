import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const semesterSchema = new Schema(
  {
    periodNumber: {
      type: 'number',
      trim: true,
      required: true,
      min: 1,
      max: 10,
    },
    courseGroups: {
      type: 'object',
    },
  },
  { timestamps: true },
);

export default model('Semester', semesterSchema);
