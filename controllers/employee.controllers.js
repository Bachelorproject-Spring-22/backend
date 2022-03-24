import courseModel from '../models/course.js';
import userModel from '../models/user.js';

import { createBadRequest, createNotFound } from '../utils/errors.js';

export const updateUserWithCourses = async (req, res, next) => {
  const { course } = req.body;
  const { username } = req.user;

  if (!course) return next(createNotFound('Course not found'));

  const checkUser = await userModel.findOne({ username }, { courses: 1 }).sort({ _id: 1 }).lean();
  if (!checkUser) return next(createBadRequest('User(s) does not exist'));

  const checkStudyCourse = await courseModel.find({ courseId: course }).lean();
  if (checkStudyCourse.length === 0) return next(createBadRequest('course(s) does not exist'));

  const checkIfCourseIsAddedToUser = [];
  course.forEach((courses) => {
    checkUser.courses.forEach((data) => {
      if (data === courses) return checkIfCourseIsAddedToUser.push(courses);
    });
  });

  if (checkIfCourseIsAddedToUser.length !== 0)
    return next(
      createBadRequest(`Remove following courseId(s) from input [${checkIfCourseIsAddedToUser}]`, {
        courses: checkIfCourseIsAddedToUser,
      }),
    );

  //contains courses that is added on user
  const courses = [];

  // Used for existingUsers: https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
  // Used for userThatDoesNotExist: https://stackoverflow.com/questions/55773869/how-to-get-the-difference-of-two-string-arrays
  const existingCourses = course.filter((course) =>
    checkUser.courses.some((data) => {
      return course !== data.courseId && courses.push(course);
    }),
  );

  const coursesThatDoesNotExist = course.filter((courseId) => !existingCourses.includes(courseId));
  await userModel.updateOne({ username }, { $push: { courses } });

  res.status(201).json({
    message: `Courses added successfully [${courses}]`,
    warning: `Courses that were not added [${coursesThatDoesNotExist}]`,
  });
};
