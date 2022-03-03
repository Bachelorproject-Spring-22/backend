import excelToJson from 'convert-excel-to-json';
import fs from 'fs';

export const readDataFromExcel = (file) => {
  const sourceFile = excelToJson({
    source: fs.readFileSync(file),
    range: 'B5',
  });

  const numberOfSheets = sourceFile['Overview'][0].B[0];

  const returnAllSheets = (sheets) => {
    let array = [];
    for (let i = 0; i < sheets; i++) {
      array.push(`${i + 1} Quiz`);
    }
    return array;
  };

  const allQuizSheets = excelToJson({
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
        header: { rows: 1 },
        range: 'A2:B5',
      },
    ],
  });

  return allQuizSheets;
};
