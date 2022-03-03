import kahootModel from '../models/kahoot.js';
import activityModel from '../models/activity.js';

import { readDataFromExcel } from '../config/excelToJson.js';

export const quizUpload = async (req, res, next) => {
  const filePath = req.file;
  if (!filePath) return res.status(400).json({ error: 'Please upload a file' });
  const dataFromExcel = readDataFromExcel(req.file.path);
  if (!dataFromExcel) {
    return res.status(500).json({ error: 'Server error' }); // TODO: Change this error
  }
  const finalScores = dataFromExcel['Final Scores'].map((user) => user);

  const kahoot = new kahootModel({
    playedOn: dataFromExcel['Overview'][0].B,
    hostedBy: dataFromExcel['Overview'][1].B,
    numberOfPlayers: dataFromExcel['Overview'][2].B,
    finalScores,
  });

  const activityId = '621d00bdb3306339b3d630e5';
  await activityModel.updateOne({ _id: activityId }, { $push: { sources: kahoot._id } });

  try {
    await kahoot.save();
    res.status(201).json({ message: 'Quiz uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating quiz', error });
  }
};
