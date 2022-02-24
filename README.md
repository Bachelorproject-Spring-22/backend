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

GET / - test route atm
POST /login - user login
POST /api/refresh - refresh token
POST /api/revoke - revoke token

POST /superAdmin/users - creating a new user
