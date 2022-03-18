import excelToJson from 'convert-excel-to-json';
import fs from 'fs';

export const readDataFromExcel = (file) => {
  return excelToJson({
    source: fs.readFileSync(file),
    header: { rows: 3 },
    sheets: [
      {
        name: 'Final Scores',
        header: { rows: 3 },
        columnToKey: {
          A: 'rank',
          B: 'player',
          C: 'totalScore',
          D: 'correctAnswers',
          E: 'incorrectAnswers',
        },
      },
      {
        name: 'Overview',
        header: { rows: -1 },
        range: 'A1:B5',
      },
    ],
  });
};
