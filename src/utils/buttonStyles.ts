import { CommonButtonColors } from "../constants/formColors";

// Common button styles
export const getSubmitButtonStyle = (): string => {
  return `min-w-[120px] rounded-md ${CommonButtonColors.action.submit} px-5 py-3 text-base font-bold transition-colors`;
};

export const getCancelButtonStyle = (): string => {
  return `min-w-[120px] rounded-md ${CommonButtonColors.action.cancel} px-5 py-3 text-base font-bold transition-colors`;
};

/** Neutral button, e.g. Cancel next to a red Delete. */
export const getSecondaryButtonStyle = (): string => {
  return "min-w-[120px] rounded-md bg-gray-200 px-5 py-3 text-base font-bold text-gray-800 transition-colors hover:bg-gray-300";
};
