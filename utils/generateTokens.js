import jwt from 'jsonwebtoken';
import calculateSemester from './calculateSemester.js';
export default function generateJwtToken(user, studyProgrammeCode, year, programmes) {
  const programmeCode = user.programmeCode ? user.programmeCode : studyProgrammeCode;
  const programmeYear = user.year ? user.year : year;
  const studyProgrammes = user.studyProgrammes.length !== 0 ? user.studyProgrammes : programmes;
  const studyPeriod = calculateSemester(programmeYear, user.role, programmeCode);
  return jwt.sign(
    {
      _id: user.id,
      role: user.role,
      username: user.username,
      studyProgrammeCode: programmeCode,
      periodNumber: studyPeriod,
      studyProgrammes: user.role !== 'student' ? studyProgrammes : null,
    },
    process.env.TOKEN_SECRET,
    {
      expiresIn: '15m',
    },
  );
}
