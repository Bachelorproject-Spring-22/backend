import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const kahootSchema = new Schema(
  {
    partOfCourse: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    course: {
      courseId: String,
      code: String,
      name: String,
    },
    quizId: {
      type: String,
      unique: true,
      default: function () {
        const _t = this;
        const date = new Date(_t.playedOn);
        const day = date.getDate();
        const month = date.getMonth();
        return `${_t.title}-${day}-${month}`;
      },
    },
    title: {
      type: String,
      required: true,
    },
    playedOn: {
      type: Date,
      required: true,
    },
    hostedBy: {
      type: String,
      required: true,
    },
    numberOfPlayers: {
      type: String,
      required: true,
    },
    finalScores: [
      {
        rank: {
          type: Number,
        },
        player: {
          type: String,
          trim: true,
          lowercase: true,
        },
        totalScore: {
          type: Number,
        },
        correctAnswers: {
          type: Number,
        },
        incorrectAnswers: {
          type: Number,
        },
      },
    ],
  },
  { timestamps: true },
);

export default model('Kahoot', kahootSchema);
