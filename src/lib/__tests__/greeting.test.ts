import { greetingFor } from '../greeting';

describe('greetingFor', () => {
  it.each([
    [0, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [16, 'Good afternoon'],
    [17, 'Good evening'],
    [23, 'Good evening'],
  ] as const)('returns the greeting for hour %i', (hour, greeting) => {
    expect(greetingFor(hour)).toBe(greeting);
  });
});
