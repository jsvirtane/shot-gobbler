/** Every tab in the app, as used in the `tab` URL parameter. */
export const TABS = ["docs", "shots", "touches", "pass-chains"] as const;

export type Tab = (typeof TABS)[number];

/** Tabs that hold user data (everything except the docs page). */
export type DataTab = Exclude<Tab, "docs">;
