import { NotFoundError } from '../../domain/actions';
import { InvalidAllocationError } from '../../domain/efAllocationActions';
import { GoalLockedError, GoalTargetBelowMinimumError } from '../../domain/goalActions';
import { friendlyError } from '../friendlyError';

describe('friendlyError', () => {
  it('maps known typed domain errors to plain messages', () => {
    expect(friendlyError(new NotFoundError('Plan', 'p1'))).toBe('The requested item could not be found.');
    expect(friendlyError(new GoalLockedError())).toBe('This goal is locked and cannot be changed.');
    expect(friendlyError(new GoalTargetBelowMinimumError(1000))).toBe('The target is below the minimum allowed value.');
    expect(friendlyError(new InvalidAllocationError())).toBe('Emergency fund percentages must total 100%.');
  });

  it('maps validation and not-found messages without exposing raw details', () => {
    expect(friendlyError(new Error('Name is required'))).toBe('Please complete the required information.');
    expect(friendlyError(new Error('The plan was not found'))).toBe('The requested item could not be found.');
  });

  it('uses a generic message for unrecognized values', () => {
    expect(friendlyError(new Error('sensitive internal details'))).toBe('Something went wrong. Please try again.');
    expect(friendlyError({ message: 42 })).toBe('Something went wrong. Please try again.');
    expect(friendlyError(null)).toBe('Something went wrong. Please try again.');
    expect(friendlyError('raw error text')).toBe('Something went wrong. Please try again.');
  });
});
