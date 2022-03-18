# The Kahoot! League - Backend

# Folder structure

Source: https://medium.com/codechef-vit/a-better-project-structure-with-express-and-node-js-c23abc2d736f

1. Controllers- contains all the functions
2. Routes- contains all the routes
3. Models- contains all the schemas
4. Middleware- contains all the middlewares
5. Utils- contains common functions
6. Templates- contains templates f.ex email etc.
7. Config- contains configuration for services like passport

# Routes

```
ROUTE Auth '/'
GET /                                       | Used to check connection
POST /login                                 | Input: Username && password
POST /upload                                | Input: File && courseId
POST /api/refresh                           | Input: HTTPOnly cookie
POST /api/revoke                            | Input: HTTPOnly cookie

ROUTE Home '/home'
GET /                                       | Current semester course name, code and quiz overall placement
GET /:courseId                              | Course leaderboard top 3, individual quiz results
GET /:courseId/:quizId                      | Individual quiz results

ROUTE leaderboard '/leaderboard'
GET /                                       | Current semester course name, code and quiz overall placement
GET /:courseId                              | Course leaderboard top 3, individual quiz results
POST /:courseId                             | Input: startDate, endDate

ROUTE superAdmin '/superAdmin'
POST /user                                  | Input: Username, role, email, password, programmeCode, year
POST /course                                | Input: code, name, credits, year, semester, activities
POST /programme                             | Input: ProgrammeCode, year, name, startTerm, semesters
PATCH /programme/:studyProgrammeCode        | Input: array[username(s)]
PATCH /programme/:courseId                  | Input: periodNumber, courseId

```
