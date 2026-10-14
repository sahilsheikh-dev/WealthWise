import { NotFoundError } from '../domain/actions';
import { InvalidAllocationError } from '../domain/efAllocationActions';
import { GoalLockedError, GoalTargetBelowMinimumError } from '../domain/goalActions';

export function friendlyError(error: unknown): string {
  if (error instanceof NotFoundError) return 'The requested item could not be found.';
  if (error instanceof GoalLockedError) return 'This goal is locked and cannot be changed.';
  if (error instanceof GoalTargetBelowMinimumError) return 'The target is below the minimum allowed value.';
  if (error instanceof InvalidAllocationError) return 'Emergency fund percentages must total 100%.';
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    const message = (error as { message: string }).message;
    if (message.includes('required') || message.includes('Enter')) return 'Please complete the required information.';
    if (message.includes('not found')) return 'The requested item could not be found.';
  }
  return 'Something went wrong. Please try again.';
}
