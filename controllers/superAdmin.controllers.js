import userModel from '../models/user.js';
import bcrypt from 'bcryptjs';
import studyProgrammeModel from '../models/studyProgramme.js';
import semesterModel from '../models/semester.js';
import courseGroupModel from '../models/courseGroups.js';
import courseModel from '../models/course.js';
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
  const { code, name, credits, year, semester, studyProgrammeCodes } = req.body;

  if (!code || !name || !credits || !year || !semester) {
    return res.status(400).json({ error: 'code, name, credits, year, semester is required' });
  }
  const courseId = `${code}-${year}-${semester}`;
  const courseExists = await courseModel.exists({ courseId });
  if (courseExists) return res.status(400).json({ error: 'Course already exists' });

  const studyProgrammeData = await studyProgrammeModel.find({ studyProgrammeCodes });

  const course = new courseModel({
    code,
    courseId,
    name,
    credits,
  });
  try {
    //await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when getting study programme' });
  }
};

export const updateCourseGroupWithCourse = async (req, res) => {};

const createSemesterAndCourseGroup = (semesterNumbers, programmeCode, year, name) => {
  const semesterArray = [];

  let periodNumber;
  for (let i = 0; i < semesterNumbers; i++) {
    let periodToYear;
    for (let i = 0; i < semesterNumbers; i++) {
      switch (i + 1) {
        case 1:
          periodToYear = 1;
          break;
        case 2:
          periodToYear = 1;
          break;
        case 3:
          periodToYear = 2;
          break;
        case 4:
          periodToYear = 2;
          break;
        case 5:
          periodToYear = 3;
          break;
        case 6:
          periodToYear = 3;
          break;
        case 7:
          periodToYear = 4;
          break;
        case 8:
          periodToYear = 4;
          break;
        case 9:
          periodToYear = 5;
          break;
        case 10:
          periodToYear = 5;
          break;
        default:
          throw new Error('Invalid period number');
      }
      const courseGroups = new courseGroupModel({
        code: `${programmeCode}${periodToYear}-${year.toString().slice(-2)}`,
        name: `${name}-${periodToYear}.year`,
      });

      let semester = new semesterModel({
        periodNumber: i + 1,
        courseGroups,
      });
      semesterArray.push(semester);
    }
    return semesterArray;
  }
};

export const createProgramme = async (req, res) => {
  const { programmeCode, year, name, startTerm, semesters } = req.body;

  if (!programmeCode || !year || !name || !startTerm || !semesters) {
    return res.status(400).json({ error: 'programmeCode, year, name, startTerm is required' });
  }
  const studyProgrammeCode = `${programmeCode}${year}`;
  const studyProgrammeExists = await studyProgrammeModel.exists({ studyProgrammeCode });
  if (studyProgrammeExists) return res.status(400).json({ error: 'Programme already exists' });

  const data = createSemesterAndCourseGroup(semesters, programmeCode, year, name);
  const studyProgramme = new studyProgrammeModel({
    programmeCode,
    year,
    name,
    startTerm,
    studyPeriods: data,
  });
  try {
    await studyProgramme.save();
    res.status(201).json({ message: 'StudyProgramme created successfully', studyProgramme });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme', error });
  }
};

export const getSemesterData = async (req, res) => {
  const { studyProgrammeCode } = req.body;

  if (!studyProgrammeCode) {
    return res.status(400).json({ error: 'StudyProgramme code is required' });
  }

  try {
    const getStudyProgrammeCode = await studyProgrammeModel.findOne({ studyProgrammeCode });
    const getMoreData = await semesterModel.find({ _id: getStudyProgrammeCode.studyPeriods });
    const getSemesterData = getMoreData.filter((data) => {
      if (data.courseGroups.length > 0) {
        return data.courseGroups;
      }
    });

    const courseGroupsArray = [];
    getSemesterData.forEach((data) => {
      data.courseGroups.map((group) => courseGroupsArray.push(group));
    });
    const getCourseGroups = await courseGroupModel.find({ _id: courseGroupsArray });

    res.status(201).json({
      message: 'StudyProgramme resolved successfully',
      studyProgramme: getStudyProgrammeCode,
      getSemester: getMoreData,
      getCourseGroups,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when getting study programme' });
  }
};
