import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const kahootSchema = new Schema(
  {
    partOfCourse: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    playedOn: {
      type: Date,
      required: true,
    },
    hostedBy: {
      type: 'string',
      required: true,
    },
    numberOfPlayers: {
      type: 'string',
      required: true,
    },
    finalScores: [
      {
        rank: {
          type: 'number',
        },
        player: {
          type: 'string',
          trim: true,
          lowercase: true,
        },
        totalScore: {
          type: 'number',
        },
        correctAnswers: {
          type: 'number',
        },
        incorrectAnswers: {
          type: 'number',
        },
      },
    ],
    quizPerformance: {
      totalCorrectAnswers: {
        type: 'number',
      },
      totalIncorrectAnswers: {
        type: 'number',
      },
      averageScore: {
        type: 'number',
      },
    },
  },
  { timestamps: true },
);

export default model('Kahoot', kahootSchema);
