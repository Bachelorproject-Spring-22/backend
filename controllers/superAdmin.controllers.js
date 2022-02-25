import kahootModel from '../models/kahoot.js';
import activity from '../models/activity.js';

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

export const quizUpload = (req, res, next) => {
  console.log(readDataFromExcel(req.file.path));
  const test = readDataFromExcel(req.file.path);
  console.log(test.Overview[0].A, test.Overview[0].B);
  return res.sendStatus(200);
};
