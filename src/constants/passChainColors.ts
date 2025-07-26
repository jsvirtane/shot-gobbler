import { ChainActionType } from "../types/PassChain";

export const PassChainActionColors: Record<ChainActionType, string> = {
  pass: "bg-blue-500",
  carry: "bg-green-500",
  shot: "bg-orange-500",
  cross: "bg-yellow-500",
  start: "bg-gray-300", // For the initial action in a chain
  placeholder: "bg-gray-300",
};
