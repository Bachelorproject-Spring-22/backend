import mongoose from 'mongoose';
import userModel from './models/user.js';
import studyProgrammeModel from './models/studyProgramme.js';
import courseModel from './models/course.js';
import kahootModel from './models/kahoot.js';

import dotenv from 'dotenv';
dotenv.config();

mongoose
  .connect(process.env.MONGODB_CONNECTION_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to DB!'))
  .catch((error) => console.log(error));

const seedUsers = [
  { username: 'seedSuperAdmin', password: 'testingUser!', role: 'superAdmin' },
  { username: 'seedTeacher', password: 'testingUser!', role: 'teacher', programmeCode: 'SEED', year: 2022 },
  { username: 'seedStudent', password: 'testingUser!', role: 'student', programmeCode: 'SEED', year: 2022 },
];

const seedStudyProgramme = [
  {
    programmeCode: 'SEED',
    year: 2022,
    name: 'Seeding programme',
    startTerm: 'fall',
    studyPeriods: [
      {
        periodNumber: 1,
        dates: {
          term: 'fall',
          startDate: 'August',
          endDate: 'December',
        },
        code: 'IDG99991_22',
        name: 'Seeding course-1.year',
        startTerm: 'fall',
        courses: [],
      },
      {
        periodNumber: 2,
        dates: {
          term: 'spring',
          startDate: 'Januar',
          endDate: 'Juni',
        },
        code: 'IDG99991_22',
        name: 'Seeding course-1.year',
        startTerm: 'fall',
        courses: [],
      },
      {
        periodNumber: 3,
        dates: {
          term: 'fall',
          startDate: 'August',
          endDate: 'December',
        },
        code: 'IDG99992_22',
        name: 'Seeding course-2.year',
        startTerm: 'fall',
        courses: [],
      },
      {
        periodNumber: 4,
        dates: {
          term: 'spring',
          startDate: 'Januar',
          endDate: 'Juni',
        },
        code: 'IDG99992_22',
        name: 'Seeding course-2.year',
        startTerm: 'fall',
        courses: [],
      },
      {
        periodNumber: 5,
        dates: {
          term: 'fall',
          startDate: 'August',
          endDate: 'December',
        },
        code: 'IDG99993_22',
        name: 'Seeding course-3.year',
        startTerm: 'fall',
        courses: [],
      },
      {
        periodNumber: 6,
        dates: {
          term: 'spring',
          startDate: 'Januar',
          endDate: 'Juni',
        },
        code: 'IDG99993_22',
        name: 'Seeding course-3.year',
        startTerm: 'fall',
        courses: [],
      },
    ],
    users: [],
    studyProgrammeCode: 'BWU19',
  },
];

const seedCourse = [
  {
    code: 'IDG9999',
    courseId: 'IDG9999_f2022',
    name: 'Seeding course',
    credits: 7.5,
    year: 2022,
    semester: 'fall',
    activities: [
      { variant: 'quiz', name: 'kahoot' },
      { variant: 'cover', name: 'keynote' },
    ],
  },
];

const seedKahoot = [
  {
    title: 'idg9999_seeding_kahoot_1',
    playedOn: Date('2022-03-18T00:00:00.000+00:00'),
    hostedBy: 'seeding',
    numberOfPlayers: '3 players',
    course: {
      code: 'IDG9999',
      name: 'Seeding course',
      courseId: 'IDG9999_f2022',
    },
    finalScores: [
      { rank: 1, player: 'seedSuperAdmin', totalScore: 5000, correctAnswers: 5, incorrectAnswers: 0 },
      { rank: 2, player: 'seedTeacher', totalScore: 4000, correctAnswers: 4, incorrectAnswers: 1 },
      { rank: 3, player: 'seedStudent', totalScore: 3000, correctAnswers: 3, incorrectAnswers: 2 },
    ],
  },
];

const test = async () => {
  /*   await userModel.deleteMany({});
  await studyProgrammeModel.deleteMany({});
  await courseModel.deleteMany({});
  await courseModel.deleteMany({}); */

  await Promise.all([
    /*     userModel.deleteMany({}),
    studyProgrammeModel.deleteMany({}),
    courseModel.deleteMany({}),
    courseModel.deleteMany({}), */
    userModel.insertMany(seedUsers),
    studyProgrammeModel
      .insertMany(seedStudyProgramme)
      .then(
        userModel
          .find({ username: seedUsers.username })
          .then(({ _id }) =>
            studyProgrammeModel.updateMany({ studyProgrammeCode: 'IDG9999_f2022' }, { $push: { _id } }),
          ),
      ),

    courseModel.insertMany(seedCourse).then(
      courseModel.findOne({ courseId: 'IDG9999_f2022' }).then(({ _id }) =>
        studyProgrammeModel.updateOne(
          { studyProgrammeCode: 'IDG9999_f2022' },
          {
            $push: { 'studyPeriods.$[studyPeriods].courses': { _id } },
            arrayFilters: [{ 'studyPeriods.periodNumber': 6 }],
          },
        ),
      ),
    ),
    kahootModel.insertMany(seedKahoot),
  ]);
  console.log('Disconnected from DB!');
  mongoose.connection.close();
};

test();
