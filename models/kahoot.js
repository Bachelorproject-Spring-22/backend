import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const kahootSchema = new Schema(
  {
    partOfCourse: {
      ref: 'Course',
      required: true,
    },
    playedOn: {
      type: Date,
      required: true,
    },
    hostedBy: {
      ref: 'User',
      required: true,
    },
    numberOfQuestions: {
      type: 'number',
      required: true,
    },
    numberOfPlayers: {
      type: 'number',
      required: true,
    },
    finalScore: {
      position: {
        number: 'number',
        required: true,
      },
      player: {
        type: 'array',
      },
      totalScore: {
        type: 'number',
        required: true,
      },
      correctAnswers: {
        type: 'number',
        required: true,
      },
      inCorrectAnswers: {
        type: 'number',
        required: true,
      },
    },
    quizPerformance: {
      totalCorrectAnswers: {
        type: 'number',
        required: true,
      },
      totalInCorrectAnswers: {
        type: 'number',
        required: true,
      },
      averageScore: {
        type: 'number',
        required: true,
      },
    },
  },
  { timestamps: true },
);

export default model('Kahoot', kahootSchema);
