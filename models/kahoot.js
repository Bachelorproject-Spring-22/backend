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
