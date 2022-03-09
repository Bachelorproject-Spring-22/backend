import bcrypt from 'bcryptjs';
import courseModel from '../models/course.js';
import studyProgrammeModel from '../models/studyProgramme.js';
import userModel from '../models/user.js';

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
  const { code, name, credits, year, semester } = req.body;

  if (!code || !name || !credits || !year || !semester) {
    return res.status(400).json({ error: 'code, name, credits, year, semester is required' });
  }
  const courseId = `${code}_${year}_${semester}`;
  const courseExists = await courseModel.exists({ courseId });
  if (courseExists) return res.status(400).json({ error: 'Course already exists' });

  const course = new courseModel({
    code,
    courseId,
    name,
    credits,
  });

  try {
    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when getting study programme' });
  }
};

export const updateCourseGroupWithCourse = async (req, res) => {
  // Pseudo code
  // Check if req.body contains the required info | x
  // Check if course exist | x
  // Check if studyProgramme exists | x
  // Check if course is already added to the courseGroup | x
  // Update courseGroup with the new course | x

  const { studyProgrammeCode, periodNumber, courseId } = req.body;
  if (!studyProgrammeCode || !periodNumber || !courseId)
    return res.status(400).json({ error: 'StudyProgrammeCode and studyPeriod must be specified' });

  const course = await courseModel.findOne({ courseId }).lean();
  if (!course) return res.status(404).json({ error: 'Course does not exist' });

  const studyProgramme = await studyProgrammeModel.findOne({ studyProgrammeCode }).lean();
  if (!studyProgramme) return res.status(404).json({ error: 'StudyProgramme does not exist' });

  const checkStudyPeriod = await studyProgrammeModel.aggregate([
    { $match: { studyProgrammeCode } },
    { $unwind: '$studyPeriods' },
    { $match: { 'studyPeriods.periodNumber': periodNumber } },
    { $unwind: '$studyPeriods.courses' },
    { $project: { 'studyPeriods.code': 1, 'studyPeriods.courses': 1 } },
  ]);

  const _id = course._id;

  // check if checkStudyPeriod returns an populated array (Course is already added)
  if (checkStudyPeriod.length !== 0) {
    let studyPeriodId = checkStudyPeriod[0].studyPeriods.courses.toString();
    if (studyPeriodId === _id.toString())
      return res.status(404).json({ error: `Course is already added to semester ${periodNumber}` });
  }

  await studyProgrammeModel.updateOne(
    { studyProgrammeCode },
    { $push: { 'studyPeriods.$[studyPeriods].courses': { _id } } },
    { arrayFilters: [{ 'studyPeriods.periodNumber': periodNumber }] },
  );

  try {
    res.status(201).json({
      message: `Updated Study plan successfully added Course: ${course.name} ${course.code} (${courseId}) to SemesterPeriod: (${periodNumber})`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when getting study programme' });
  }
};

const createSemesterAndCourseGroup = (semesterNumbers, programmeCode, year, name, startTerm) => {
  const semesterArray = [];

  let periodNumber;
  for (let i = 0; i < semesterNumbers; i++) {
    let periodToYear;
    for (let i = 0; i < semesterNumbers; i++) {
      switch (i + 1) {
        case 1:
        case 2:
          periodToYear = 1;
          break;
        case 3:
        case 4:
          periodToYear = 2;
          break;
        case 5:
        case 6:
          periodToYear = 3;
          break;
        case 7:
        case 8:
          periodToYear = 4;
          break;
        case 9:
        case 10:
          periodToYear = 5;
          break;
        default:
          throw new Error('Invalid period number');
      }

      let semester = {
        periodNumber: i + 1,
        code: `${programmeCode}${periodToYear}-${year.toString().slice(-2)}`,
        name: `${name}-${periodToYear}.year`,
        startTerm,
        courses: [],
      };

      semesterArray.push(semester);
    }
    return semesterArray;
  }
};

export const updateProgrammeWithUsers = async (req, res) => {
  // Pseudo code
  // Check if req.body contains the required info | x
  // Check if user exist | x
  // Check if studyProgramme exists | x
  // Check if user is already added to the studyPlan | x
  // Update studyPlan with the new user | x

  const username = ['monster', 'test', 'bobble', 'glenneha'];

  const { studyProgrammeCode } = req.body;
  if (!studyProgrammeCode) {
    return res.status(400).json({ error: 'studyProgrammeCode and user is required' });
  }

  const checkUser = await userModel.find({ username }, { username: 1 }).sort({ _id: 1 }).lean();
  if (checkUser.length === 0) return res.status(400).json({ error: 'User(s) does not exist' });

  const checkStudyProgrammeCode = await studyProgrammeModel.findOne({ studyProgrammeCode }).lean();
  if (!checkStudyProgrammeCode) return res.status(400).json({ error: 'Programme does not exist' });

  let checkIfUserIsAddedToProgramme = [];
  checkUser.forEach((user) => {
    checkStudyProgrammeCode.users.forEach((name) => {
      if (user._id.toString() === name.toString()) {
        checkIfUserIsAddedToProgramme.push(user.username);
      }
    });
  });

  if (checkIfUserIsAddedToProgramme.length !== 0) {
    return res.status(400).json({
      error: `Remove following user(s) from input [${checkIfUserIsAddedToProgramme}]`,
      users: checkIfUserIsAddedToProgramme,
    });
  }
  let users = [];

  // Used for existingUsers: https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
  // Used for userThatDoesNotExist: https://stackoverflow.com/questions/55773869/how-to-get-the-difference-of-two-string-arrays
  const existingUsers = username.filter((user) =>
    checkUser.some((names) => {
      return user === names.username && users.sort().push(names._id);
    }),
  );
  const usersThatDoesNotExist = username.filter((user) => !existingUsers.includes(user));

  try {
    await studyProgrammeModel.updateOne({ studyProgrammeCode }, { $push: { users } });
    res.status(201).json({
      message: `Users added successfully [${existingUsers}]`,
      warning: `Users that were not added [${usersThatDoesNotExist}]`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme' });
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

  const data = createSemesterAndCourseGroup(semesters, programmeCode, year, name, startTerm);

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
    res.status(201).json({
      message: 'StudyProgramme resolved successfully',
      studyProgramme: getStudyProgrammeCode,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when getting study programme' });
  }
};
