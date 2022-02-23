import { Schema, model } from 'mongoose';

const studyProgramme = new Schema(
  {
    programmeCode: {
      type: 'string',
      required: true,
    },
    year: {
      type: 'string',
      required: true,
    },
    startTerm: {
      type: 'number',
      required: true,
    },
    studyPeriods: {
      type: 'array',
      ref: 'Semester',
    },
    users: {
      type: 'array',
      ref: 'User',
    },
  },
  { timestamps: true },
);

module.exports = model('studyProgramme', studyProgramme);
