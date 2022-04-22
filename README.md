
# uniLeague

uniLeague is a way to improve your learning by actively participating in class. You collect points by answering quizzes and participating in class. uniLeague is a new way to keep track of your own learning results.

uniLeague is a bachelor project for the web development degree at NTNU Gjøvik. Its task is to measure student engagement based on the usage of Kahoot! - an interactive quiz tool. The project's purpose is to find factors that determine if a student will be engaged by using Kahoot - or simply going through the lecture.

When designing uniLeague, we always aim to consider the environment. In fact, uniLeague is built with sustainability in mind. uniLeague is more environmentally friendly than 90% of other websites. Some of our happy green practices include a dark color palette and minimal use of fonts and symbols to reduce energy consumption and carbon dioxide emissions, as well as to display all essential information without loading multiple pages. 🌳

## Demo

A live demo of the project can be found here:
https://unileague.games/


## Tech Stack

**Client:** React

**Server:** Node.js, MongoDB


## Features

- Upload quiz results to the platform
- Delete quizzes
- View class/semester/study leaderboard
- View personal stats on the "My Results" page
- See a graphical representation of your quixperformence
- Select a time frame to see how the leaderboard looks during that time
- Sustainable design
## Run Locally

Clone the project

```bash
  git clone https://github.com/Bachelorproject-Spring-22/frontend.git

  git clone https://github.com/Bachelorproject-Spring-22/backend.git
```

Go to the project directory

```bash
  cd Bachelorproject-Spring-22
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```


## Screenshots

![App Screenshot](https://unileague.games/static/media/1_iphone13progold_portrait.d173fa780af7ddf3355e.avif)
![App Screenshot](https://unileague.games/static/media/2_iphone13prographite_portrait.4c15b2988e0309baa6d4.avif)
![App Screenshot](https://unileague.games/static/media/3_iphone13prosierrablue_portrait.9b6a60857a72ecf06e38.avif)
## Authors

- Cornelius Ottar Sandmæl - [@sandmal](https://github.com/sandmal)
- Glenn Eirik Hansen - [@glennispotatis](https://github.com/glennispotatis)
- Tom Schrier - [@TomSchrier](https://github.com/TomSchrier)


## License

[MIT](https://choosealicense.com/licenses/mit/)

## Folder structure
Source: https://medium.com/codechef-vit/a-better-project-structure-with-express-and-node-js-c23abc2d736f
1. Controllers- contains all the functions
2. Routes- contains all the routes
3. Models- contains all the schemas
4. Middleware- contains all the middlewares
5. Utils- contains common functions
6. Templates- contains templates f.ex email etc.
7. Config- contains configuration for services like passport

## Routes
POST /                                      | Input: File && courseId
GET /                                       | Get course ids from admin user
GET /programme                              | Get all studyplans
POST /programme                             | Input: object {"studyProgrammeCode": array of studyProgrammeCode(s)}
GET /courses                                | Get course info from user subscribed studyplans
GET /courses/:courseId                      | Get course and quiz info from user subscribed studyplans
DELETE /courses/:courseId/:quizId'          | Params: courseId && quizId
ROUTE superAdmin '/superAdmin'
POST /user                                  | Input: Username, role, email, password, programmeCode, year
POST /course                                | Input: code, name, credits, year, semester, activities
POST /programme                             | Input: ProgrammeCode, year, name, startTerm, semesters
PATCH /programme/:studyProgrammeCode        | Input: array[username(s)]
PATCH /programme/:courseId                  | Input: periodNumber, courseId