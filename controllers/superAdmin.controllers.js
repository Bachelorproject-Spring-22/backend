import userModel from '../models/user.js';
import bcrypt from 'bcryptjs';

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

export const createSemester = async (req, res) => {
  const { year, periodNumber, name } = req.body;
  if (!year || !name || !periodNumber) {
    return res.status(400).json({ error: 'year, periodnumber and year is required' });
  }
};

export const createProgramme = async (req, res) => {
  const { programmeCode, year, name, startTerm, studyPeriods } = req.body;
  if (programmeCode || !year || !name || !startTerm || !studyPeriods) {
    return res.status(400).json({ error: 'programmeCode, year, name, startTerm, studyPeriods is required' });
  }
};
