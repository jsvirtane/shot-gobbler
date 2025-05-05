import { ActionOutcome, unsuccessfullOutcomes,  } from "../types/Action";

export const isSuccessfulActionOutcome = (
  outcome: ActionOutcome,
): boolean => {
  return !unsuccessfullOutcomes.includes(outcome as never);
}
