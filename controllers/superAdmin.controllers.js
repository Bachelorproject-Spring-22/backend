import bcrypt from 'bcryptjs';
import courseModel from '../models/course.js';
import studyProgrammeModel from '../models/studyProgramme.js';
import userModel from '../models/user.js';

import { createBadRequest, createNotFound } from '../utils/errors.js';
// Helper functions

const createActivitiesForCourse = (activities) => {
  const activitiesArray = [];

  for (let i = 0; i < activities.length; i++) {
    const { variant, name } = activities[i];
    const activitiy = {
      variant,
      name,
    };
    activitiesArray.push(activitiy);
  }
  return activitiesArray;
};

const createStudyPeriod = (semesterNumbers, programmeCode, year, name, startTerm) => {
  const semesterArray = [];

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

      const semester = {
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

//
// @USER
//

// Super Admins can invite users
export const createUser = async (req, res, next) => {
  const { username, role, email, password, programmeCode, year } = req.body;
  //validate fields
  if (!username || !role || !password || !programmeCode || !year)
    return next(createBadRequest('Username, role or programmeCode or year password are required'));

  const userExists = await userModel.exists({ username });
  if (userExists) return next(createBadRequest('User already exists'));

  if (email) {
    const emailExists = await userModel.exists({ email });
    if (emailExists) return next(createBadRequest('Email already exists'));
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

  await user.save();
  res.status(201).json({ message: 'User created successfully', username, role, email, programmeCode, year });
};

//
// @COURSE
//

export const createCourse = async (req, res, next) => {
  const { code, name, credits, year, semester, activities } = req.body;

  if (!code || !name || !credits || !year || !semester || !activities)
    return next(createBadRequest('Code, name, credits, year, semester and activities are required'));

  const courseId = `${code}_${semester[0]}${year}`;
  const courseExists = await courseModel.exists({ courseId });
  if (courseExists) return next(createBadRequest('Course already exists'));

  const activitiesArray = createActivitiesForCourse(activities);

  const course = new courseModel({
    code,
    courseId,
    name,
    credits,
    activities: activitiesArray,
  });

  await course.save();
  res.status(201).json({ message: 'Course created successfully', course });
};

//
// @STUDYPROGRAMME
//
export const createStudyProgramme = async (req, res, next) => {
  const { programmeCode, year, name, startTerm, semesters } = req.body;

  if (!programmeCode || !year || !name || !startTerm || !semesters)
    return next(createBadRequest('programmeCode, year, name, startTerm is required'));

  const studyProgrammeCode = `${programmeCode}${year}`;
  const studyProgrammeExists = await studyProgrammeModel.exists({ studyProgrammeCode });
  if (studyProgrammeExists) return next(createBadRequest('Programme already exists'));

  const data = createStudyPeriod(semesters, programmeCode, year, name, startTerm);

  const studyProgramme = new studyProgrammeModel({
    programmeCode,
    year,
    name,
    startTerm,
    studyPeriods: data,
  });

  await studyProgramme.save();
  res.status(201).json({ message: 'StudyProgramme created successfully', studyProgramme });
};

//
// @UPDATESTUDYPROGRAMMEWITHUSERS
//

export const updateStudyProgrammeWithUsers = async (req, res, next) => {
  const studyProgrammeCode = req.params.studyProgrammeCode;
  const { username } = req.body;
  if (!studyProgrammeCode) return next(createBadRequest('studyProgrammeCode and user is required'));

  const checkUser = await userModel.find({ username }, { username: 1 }).sort({ _id: 1 }).lean();
  if (checkUser.length === 0) return next(createBadRequest('User(s) does not exist'));

  const checkStudyProgrammeCode = await studyProgrammeModel.findOne({ studyProgrammeCode }).lean();
  if (!checkStudyProgrammeCode) return next(createBadRequest('Programme does not exist'));

  let checkIfUserIsAddedToProgramme = [];
  checkUser.forEach((user) => {
    checkStudyProgrammeCode.users.forEach((name) => {
      if (user._id.toString() === name.toString()) {
        checkIfUserIsAddedToProgramme.push(user.username);
      }
    });
  });

  if (checkIfUserIsAddedToProgramme.length !== 0)
    return next(
      createBadRequest(`Remove following user(s) from input [${checkIfUserIsAddedToProgramme}]`, {
        users: checkIfUserIsAddedToProgramme,
      }),
    );

  let users = [];

  // Used for existingUsers: https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
  // Used for userThatDoesNotExist: https://stackoverflow.com/questions/55773869/how-to-get-the-difference-of-two-string-arrays
  const existingUsers = username.filter((user) =>
    checkUser.some((names) => {
      return user === names.username && users.sort().push(names._id);
    }),
  );
  const usersThatDoesNotExist = username.filter((user) => !existingUsers.includes(user));

  await studyProgrammeModel.updateOne({ studyProgrammeCode }, { $push: { users } });
  res.status(201).json({
    message: `Users added successfully [${existingUsers}]`,
    warning: `Users that were not added [${usersThatDoesNotExist}]`,
  });
};

//
// @UPDATECOURSEWIRHCOURSE
//

export const updateStudyPeriodWithCourse = async (req, res, next) => {
  // Pseudo code
  // Check if req.body contains the required info | x
  // Check if course exist | x
  // Check if studyProgramme exists | x
  // Check if course is already added to the courseGroup | x
  // Update courseGroup with the new course | x
  const courseId = req.params.courseId;
  const studyProgrammeCode = req.params.studyProgrammeCode;
  const { periodNumber } = req.body;
  if (!studyProgrammeCode || !periodNumber)
    return next(createBadRequest('StudyProgrammeCode and studyPeriod must be specified'));

  if (!courseId) return next(createNotFound('Course id not found'));
  const course = await courseModel.findOne({ courseId }).lean();
  if (!course) return next(createNotFound('Course does not exist'));

  const studyProgramme = await studyProgrammeModel.findOne({ studyProgrammeCode }).lean();
  if (!studyProgramme) return next(createNotFound('StudyProgramme does not exist'));

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
    const courseIsAlreadyAdded = checkStudyPeriod.filter(
      (studyPeriod) => studyPeriod.studyPeriods.courses.toString() === _id.toString(),
    );
    if (courseIsAlreadyAdded.length !== 0)
      return next(createBadRequest(`${courseId} is already added to semester ${periodNumber}`));
  }

  await studyProgrammeModel.updateOne(
    { studyProgrammeCode },
    { $push: { 'studyPeriods.$[studyPeriods].courses': { _id } } },
    { arrayFilters: [{ 'studyPeriods.periodNumber': periodNumber }] },
  );

  res.status(201).json({
    message: `Updated Study plan successfully added Course: ${course.name} ${course.code} (${courseId}) to SemesterPeriod: (${periodNumber})`,
  });
};
