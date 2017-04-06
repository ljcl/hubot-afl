import moment from 'moment-timezone';

import getId from './getId';

describe('getId', () => {
  test('Returns an ID for the second match of round two, 2013', () => getId(2, 2, 2013).then((res) => {
    const { type, id } = res;
    expect(type).toBe('Match');
    expect(id).toBe('CD_M20130140202');
  }));

  test('Returns an ID for round two, 2016', () => getId(2, false, 2016).then((res) => {
    const { type, id } = res;
    expect(type).toBe('Round');
    expect(id).toBe('CD_R201601402');
  }));

  test('Returns an id for the current year if request too distant', () => {
    const currentYear = moment().get('year');
    return getId(2, false, currentYear + 2).then((res) => {
      const { type, id } = res;
      expect(type).toBe('Round');
      expect(id).toBe(`CD_R${currentYear}01402`);
    });
  });

  test('Returns an id for the current year if request not actually a year', () => {
    const currentYear = moment().get('year');
    return getId(2, false, 'Bees').then((res) => {
      const { type, id } = res;
      expect(type).toBe('Round');
      expect(id).toBe(`CD_R${currentYear}01402`);
    });
  });
});
