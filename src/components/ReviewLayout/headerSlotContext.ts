import { createContext } from "react";

/**
 * The element at the bottom of the app header where a tab puts its own
 * header controls (the view switch). Null when there is no header, e.g.
 * in focus mode or when a view is rendered on its own in tests.
 */
export const HeaderSlotContext = createContext<HTMLElement | null>(null);
