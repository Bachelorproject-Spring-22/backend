let error = {};

// ERROR

export const createBadRequest = (message) => {
  error.status = 400;
  error.message = message;
  return error;
};

export const createUnauthorized = () => {
  error.status = 401;
  error.message = 'Unauthorized';
  return error;
};

export const createNotFound = (message) => {
  error.status = 404;
  error.message = message;
  return error;
};
