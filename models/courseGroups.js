import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const courseGroupsSchema = new Schema(
  {
    code: {
      type: 'string',
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
  },
  { timestamps: true },
);

export default model('CourseGroup', courseGroupsSchema);
