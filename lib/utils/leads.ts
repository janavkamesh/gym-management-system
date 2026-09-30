export const CLOSED_OUTCOMES = ['Joined', 'Not Interested'];

export function isClosedOutcome(outcome: string | null | undefined): boolean {
  return CLOSED_OUTCOMES.includes(outcome as string);
}
