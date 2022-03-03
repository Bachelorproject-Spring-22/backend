import kahootModel from '../models/kahoot.js';
import activityModel from '../models/activity.js';

import { readDataFromExcel } from '../config/excelToJson.js';
// export const useLater = (req, res, next) => {
//   const { partOfCourse, playedOn, hostedBy, numberOfQuestions, numberOfPlayers, finalScore, quizPerformance } =
//     req.body;

//   if (
//     !partOfCourse ||
//     !playedOn ||
//     !hostedBy ||
//     !numberOfQuestions ||
//     !numberOfPlayers ||
//     !finalScore ||
//     !quizPerformance
//   ) {
//     return res.status(400).json({
//       error:
//         'PartOfCourse, playedOn, hostedBy, numberOfQuestions, numberOfPlayers, finalScore and quizPerformance are required.',
//     });
//   }

//   const kahootQuiz = new kahootModel({
//     partOfCourse,
//     playedOn,
//     hostedBy,
//     numberOfQuestions,
//     numberOfPlayers,
//     finalScore,
//     quizPerformance,
//   });

//   try {
//     await userModel.save();
//     res.status(201).json({ message: 'Kahoot' });
//   } catch (error) {}
// };

export const quizUpload = async (req, res, next) => {
  const filePath = req.file;
  if (!filePath) return res.status(400).json({ error: 'Please upload a file' });
  const dataFromExcel = readDataFromExcel(req.file.path);
  if (!dataFromExcel) {
    return res.status(500).json({ error: 'Server error' }); // TODO: Change this error
  }
  const finalScores = dataFromExcel['Final Scores'].map((user) => user);
  console.log(dataFromExcel);

  const kahoot = new kahootModel({
    playedOn: dataFromExcel['Overview'][0].B,
    hostedBy: dataFromExcel['Overview'][1].B,
    numberOfPlayers: dataFromExcel['Overview'][2].B,
    finalScores,
  });

  const activity = new activityModel({
    name: 'quiz',
    type: 'kahoot',
    sources: kahoot._id,
  });

  try {
    await kahoot.save();
    await activity.save();
    res.status(201).json({ message: 'Quiz uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating quiz', error });
  }
};
