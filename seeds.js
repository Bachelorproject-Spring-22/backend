import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

let passwordOne = 'testingUser!';
let passwordTwo = 'testingUser!';
let passwordThree = 'testingUser!';
let passwordHashOne = bcrypt.hashSync(passwordOne, 10);
let passwordHashTwo = bcrypt.hashSync(passwordTwo, 10);
let passwordHashThree = bcrypt.hashSync(passwordThree, 10);

const seedUsers = [
  new userModel({
    username: 'seedSuperAdmin',
    password: passwordHashOne,
    role: 'superAdmin',
    programmeCode: 'SEED21',
    year: 2021,
  }),
  new userModel({
    username: 'seedTeacher',
    password: passwordHashTwo,
    role: 'teacher',
    programmeCode: 'SEED21',
    year: 2021,
  }),
  new userModel({
    username: 'seedStudent',
    password: passwordHashThree,
    role: 'student',
    programmeCode: 'SEED21',
    year: 2021,
  }),
];

const seedStudyProgramme = [
  new studyProgrammeModel({
    programmeCode: 'SEED',
    year: 2021,
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
    studyProgrammeCode: 'SEED21',
  }),
];

const seedKahoot = [
  new kahootModel({
    title: 'idg9999_seeding_kahoot_1',
    playedOn: new Date('2022-03-18T00:00:00.000+00:00'),
    hostedBy: 'seeding',
    numberOfPlayers: '3 players',
    course: {
      code: 'IDG9999',
      name: 'Seeding course',
      courseId: 'IDG9999_f2021',
    },
    finalScores: [
      { rank: 1, player: 'seedSuperAdmin', totalScore: 5000, correctAnswers: 5, incorrectAnswers: 0 },
      { rank: 2, player: 'seedTeacher', totalScore: 4000, correctAnswers: 4, incorrectAnswers: 1 },
      { rank: 3, player: 'seedStudent', totalScore: 3000, correctAnswers: 3, incorrectAnswers: 2 },
    ],
  }),
];
const seedCourse = [
  new courseModel({
    code: 'IDG9999',
    courseId: 'IDG9999_f2021',
    name: 'Seeding course',
    credits: 7.5,
    year: 2022,
    semester: 'fall',
    activities: [
      { variant: 'quiz', name: 'kahoot', sources: [] },
      { variant: 'cover', name: 'keynote' },
    ],
  }),
];

const test = async () => {
  await Promise.all([
    userModel.deleteMany({}),
    studyProgrammeModel.deleteMany({}),
    courseModel.deleteMany({}),
    kahootModel.deleteMany({}),

    userModel.insertMany(seedUsers),
    studyProgrammeModel.insertMany(seedStudyProgramme),
    courseModel.insertMany(seedCourse),
    kahootModel.insertMany(seedKahoot),
  ]).then(async () => {
    await studyProgrammeModel.updateOne(
      { studyProgrammeCode: 'SEED21' },
      { $push: { 'studyPeriods.$[studyPeriods].courses': { _id: seedCourse[0]._id } }, users: seedUsers },
      { arrayFilters: [{ 'studyPeriods.periodNumber': 2 }] },
    );
    await courseModel.updateOne(
      { courseId: 'IDG9999_f2021' },
      { $push: { 'activities.$[activities].sources': { _id: seedKahoot[0]._id } } },
      { arrayFilters: [{ 'activities.name': 'kahoot' }] },
    );
  });

  console.log('Disconnected from DB!');
  mongoose.connection.close();
};

test();
