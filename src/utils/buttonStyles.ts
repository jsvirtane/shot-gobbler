import { ActionFormColors } from "../constants/actionFormColors";
import { CommonButtonColors } from "../constants/formColors";
import { ShotFormColors } from "../constants/shotFormColors";
import { ActionCategory } from "../types/Action";

// Action form button styles
export const getActionFormButtonStyle = (
  selectedCategory: ActionCategory,
  isActive: boolean,
): string => {
  return isActive
    ? ActionFormColors.category[selectedCategory].active
    : ActionFormColors.category[selectedCategory].inactive;
};

export const getOutcomeButtonStyle = (
  isActive: boolean,
  isNotSuccessful?: boolean,
): string => {
  return isActive
    ? isNotSuccessful
      ? ActionFormColors.outcome.active.unsuccessful
      : ActionFormColors.outcome.active.successful
    : ActionFormColors.outcome.inactive;
};

// Shot form button styles
export const getShotFormButtonStyle = (isActive: boolean) => {
  return isActive ? ShotFormColors.active : ShotFormColors.inactive;
};

// Common button styles
export const getSubmitButtonStyle = (): string => {
  return `min-w-[120px] rounded-md ${CommonButtonColors.action.submit} px-5 py-3 text-base font-bold transition-colors`;
};

export const getCancelButtonStyle = (): string => {
  return `min-w-[120px] rounded-md ${CommonButtonColors.action.cancel} px-5 py-3 text-base font-bold transition-colors`;
};
