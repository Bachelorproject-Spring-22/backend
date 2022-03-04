import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const studyProgramme = new Schema(
  {
    studyProgrammeCode: {
      type: String,
      unique: true,
      default: function () {
        const _t = this;
        const lastTwo = _t.year.toString().slice(-2);
        return _t.programmeCode + lastTwo;
      },
    },
    name: {
      type: String,
      required: true,
    },
    programmeCode: {
      type: 'string',
      required: true,
    },
    year: {
      type: 'number',
      required: true,
    },
    startTerm: {
      type: 'string',
      enum: ['fall', 'spring'],
    },
    studyPeriods: {
      type: 'array',
    },
    users: {
      type: 'array',
      ref: 'User',
    },
  },
  { timestamps: true },
);

export default model('studyProgramme', studyProgramme);
