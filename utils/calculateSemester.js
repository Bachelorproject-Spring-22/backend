export default function calculateSemester(startYear) {
  let currentYear;
  const getCurrentDate = Date.now();
  const date = new Date(getCurrentDate);
  const onlyYear = date.getFullYear();
  const onlyMonth = date.getMonth() + 1;
  currentYear = onlyYear - startYear;

  let term, studyPeriod;
  onlyMonth < 7 ? (term = 'spring') : (term = 'fall');
  term == 'fall' ? currentYear++ : currentYear;

  if (currentYear == 3) return term == 'fall' ? (studyPeriod = 5) : (studyPeriod = 6);
  if (currentYear == 1) return term == 'fall' ? (studyPeriod = 1) : (studyPeriod = 2);
  if (currentYear == 2) return term == 'fall' ? (studyPeriod = 3) : (studyPeriod = 4);
  if (currentYear == 3) return term == 'fall' ? (studyPeriod = 5) : (studyPeriod = 6);
  if (currentYear == 4) return term == 'fall' ? (studyPeriod = 7) : (studyPeriod = 8);
  if (currentYear == 5) return term == 'fall' ? (studyPeriod = 9) : (studyPeriod = 10);
}
