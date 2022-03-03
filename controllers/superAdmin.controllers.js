import userModel from '../models/user.js';
import bcrypt from 'bcryptjs';
import studyProgrammeModel from '../models/studyProgramme.js';
import semesterModel from '../models/semester.js';
//
// @USER
//

// Super Admins can invite users
export const createUser = async (req, res) => {
  const { username, role, email, password, programmeCode, year } = req.body;
  //validate fields
  if (!username || !role || !password) {
    return res.status(400).json({ error: 'username, role, email or password is required' });
  }

  const userExists = await userModel.exists({ username });
  if (userExists) return res.status(400).json({ error: 'User already exists' });

  if (email) {
    const emailExists = await userModel.exists({ email });
    if (emailExists) return res.status(400).json({ error: 'User with email already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const user = new userModel({
    username,
    role,
    email,
    password: passwordHash,
    programmeCode,
    year,
  });

  try {
    await user.save();
    res.status(201).json({ message: 'User created successfully', username, role, email, programmeCode, year });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating user', error });
  }
};

export const createCourse = async (req, res) => {
  const { code, name, credits, studyPlanCodes } = req.body;

  if (!code || !name || !credits || !studyPlanCodes) {
    return res.status(400).json({ error: 'code, name, credits, studyPlanCodes is required' });
  }
};

const createSemester = (semesterNumbers) => {
  const semesterArray = [];

  let periodNumber;

  for (let i = 0; i < semesterNumbers; i++) {
    let semester = {
      periodNumber: i + 1,
    };
    semesterArray.push(semester);
  }
  return semesterArray;
};

export const createProgramme = async (req, res) => {
  const { programmeCode, year, name, startTerm, semesters } = req.body;

  if (!programmeCode || !year || !name || !startTerm || !semesters) {
    return res.status(400).json({ error: 'programmeCode, year, name, startTerm is required' });
  }

  const studyProgrammeCode = `${programmeCode}${year}`;

  const studyProgrammeExists = await studyProgrammeModel.exists({ studyProgrammeCode });
  if (studyProgrammeExists) return res.status(400).json({ error: 'Programme already exists' });

  const semester = createSemester(semesters);
  const semesterIds = await semesterModel.insertMany(semester);
  const studyProgramme = new studyProgrammeModel({
    programmeCode,
    year,
    name,
    startTerm,
    studyPeriods: semesterIds.map((docs) => docs._id),
  });
  try {
    await studyProgramme.save();
    res.status(201).json({ message: 'StudyProgramme created successfully', studyProgramme });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme', error });
  }
};

const getSemesterData = async (req, res) => {
  const { studyProgrammeCode } = req.body;
  if (!studyProgramme) {
    return res.status(400).json({ error: 'StudyProgramme code is required' });
  }
  const getStudyProgrammeCode = await studyProgrammeModel.findOne({ studyProgrammeCode });
};
