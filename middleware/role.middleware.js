export const SuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superAdmin') {
    next();
  } else {
    next('You are not a super admin');
  }
};

export const Teacher = (req, res, next) => {
  if (!req.user && !req.user.role === 'teacher') {
    next({ error: 'You are not a teacher' });
  }
  next();
};

export const Student = (req, res, next) => {
  if (!req.user) {
    next({ error: 'You are not a student' });
  }
  next();
};

export default { Teacher, SuperAdmin, Student };
