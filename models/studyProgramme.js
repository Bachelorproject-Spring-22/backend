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
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    startTerm: {
      type: String,
      enum: ['fall', 'spring'],
    },
    studyPeriods: [
      {
        periodNumber: {
          type: 'number',
          trim: true,
          min: 1,
          max: 10,
        },
        dates: {
          term: {
            type: String,
            enum: ['fall', 'spring'],
            default: function () {
              const _t = this;
              return _t.startTerm === 'fall'
                ? _t.periodNumber % 2 == 0
                  ? 'spring'
                  : 'fall'
                : _t.periodNumber % 2 == 0
                ? 'fall'
                : 'spring';
            },
          },
          startDate: {
            type: String,
            default: function () {
              const _t = this;
              return _t.dates.term === 'fall' ? 'August' : 'Januar';
            },
          },
          endDate: {
            type: String,
            default: function () {
              const _t = this;
              return _t.dates.term === 'fall' ? 'December' : 'Juni';
            },
          },
        },
        code: {
          type: String,
        },
        name: {
          type: String,
        },
        startTerm: {
          type: String,
          enum: ['fall', 'spring'],
        },
        courses: [
          {
            type: Schema.Types.ObjectId,
            ref: 'Course',
          },
        ],
      },
    ],
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true },
);

export default model('studyProgramme', studyProgramme);
