import moment from 'moment-timezone';
import leftpad from 'left-pad';

/**
 * Convert a provided round number and year into an AFL code
 */
function getId(round, match = false, year) {
  return new Promise((resolve) => {
    let newMatch = '';
    let newYear = '';
    let prefix = 'R';
    if (typeof match === 'number' && match % 1 === 0) {
      prefix = 'M';
      newMatch = leftpad(match, 2, 0);
    }
    // If it's not a year or a year in the future, set it to the current year.
    newYear = !moment(year, 'YYYY', true).isValid() ? moment().year() : year;
    newYear = moment(newYear, 'YYYY', true).isAfter(moment()) ? moment().year() : newYear;

    const result = {
      type: prefix === 'M' ? 'Match' : 'Round',
      id: round ? `CD_${prefix}${newYear}014${leftpad(round, 2, 0)}${newMatch}` : false,
    };
    // e.g: CD_R201501401
    resolve(result);
  });
}

export default getId;
