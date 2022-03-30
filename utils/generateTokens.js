import jwt from 'jsonwebtoken';
import calculateSemester from './calculateSemester.js';
export default function generateJwtToken(user, programmes) {
  const studyProgrammes = user.studyProgrammes.length !== 0 ? user.studyProgrammes : programmes;
  const studyPeriod = calculateSemester(user.year, user.role, user.programmeCode);
  return jwt.sign(
    {
      _id: user.id,
      role: user.role,
      username: user.username,
      studyProgrammeCode: user.programmeCode,
      periodNumber: studyPeriod,
      studyProgrammes: user.role !== 'student' ? studyProgrammes : null,
    },
    process.env.TOKEN_SECRET,
    {
      expiresIn: '15m',
    },
  );
}
