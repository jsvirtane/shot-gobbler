import { Dispatch, SetStateAction } from "react";
import { DataTabInfo } from "../config/dataTabs";
import { createEnvelope } from "./dataSchema";
import { notify } from "./notify";

/** A data tab's config together with its current data and setter. */
export type DataTabConfig<T> = DataTabInfo<T> & {
  data: T[];
  setData: Dispatch<SetStateAction<T[]>>;
};

/** Downloads the tab's data as a versioned JSON export file. */
export const exportTabData = <T>(tab: DataTabConfig<T>): void => {
  if (tab.data.length === 0) {
    notify("No data to export");
    return;
  }

  const json = JSON.stringify(createEnvelope(tab.key, tab.data), null, 2);
  const link = document.createElement("a");
  link.href = `data:text/json;charset=utf-8,${encodeURIComponent(json)}`;
  link.download = `${tab.filenamePrefix}${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
};

/**
 * Validates parsed import data and adds the valid items to the tab's
 * existing data (never replacing it). Tells the user when the file is
 * refused or when invalid items were skipped.
 */
export const importTabData = <T>(tab: DataTabConfig<T>, parsed: unknown) => {
  const result = tab.validate(parsed);
  if (!result.ok) {
    notify(result.error, "error");
    return;
  }

  tab.setData((prev) => [...prev, ...result.items]);

  const { skipped } = result;
  if (skipped > 0) {
    notify(
      `Imported ${result.items.length} ${tab.label}. Skipped ${skipped} invalid ${skipped === 1 ? "item" : "items"}.`,
    );
  }
};

/** Non-generic handle on a data tab, so the active tab can be picked by key. */
export type DataTabHandle = {
  shareTitle: string;
  hasData: boolean;
  exportData: () => void;
  importData: (parsed: unknown) => void;
};

export const toDataTabHandle = <T>(tab: DataTabConfig<T>): DataTabHandle => ({
  shareTitle: tab.shareTitle,
  hasData: tab.data.length > 0,
  exportData: () => exportTabData(tab),
  importData: (parsed) => importTabData(tab, parsed),
});
