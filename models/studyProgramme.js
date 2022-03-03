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
    programmeCode: {
      type: 'string',
      required: true,
    },
    year: {
      type: 'number',
      required: true,
    },
    startTerm: {
      enum: ['fall', 'spring'],
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

/*studyProgramme.pre('save', function (next) {
  this.studyProgrammeCode = this.get('programmeCode') + this.get('year');
  next();
});*/

export default model('studyProgramme', studyProgramme);
