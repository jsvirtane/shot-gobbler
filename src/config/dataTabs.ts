import { Action } from "../types/Action";
import { PassChain } from "../types/PassChain";
import { Shot } from "../types/Shot";
import { DataTab } from "../types/Tab";
import { envelopeCodec, StorageCodec } from "../utils/dataSchema";
import { validateImport, ValidationResult } from "../utils/importValidation";

/** Everything about a data tab that doesn't depend on React state. */
export type DataTabInfo<T> = {
  key: DataTab;
  /** Plural noun used in messages, e.g. "pass chains". */
  label: string;
  shareTitle: string;
  storageKey: string;
  /** Export file name is `${filenamePrefix}YYYY-MM-DD.json`. */
  filenamePrefix: string;
  /** Stores the data in a versioned envelope (see utils/dataSchema). */
  codec: StorageCodec<T[]>;
  validate: (data: unknown) => ValidationResult<T>;
};

export const SHOTS_TAB: DataTabInfo<Shot> = {
  key: "shots",
  label: "shots",
  shareTitle: "Shot Analysis",
  storageKey: "shot-gobbler-data",
  filenamePrefix: "shots_",
  codec: envelopeCodec<Shot>("shots"),
  validate: (data) => validateImport(data, "shots"),
};

export const TOUCHES_TAB: DataTabInfo<Action> = {
  key: "touches",
  label: "touches",
  shareTitle: "Touch Analysis",
  storageKey: "shot-gobbler-touches-data",
  filenamePrefix: "touches_",
  codec: envelopeCodec<Action>("touches"),
  validate: (data) => validateImport(data, "touches"),
};

export const PASS_CHAINS_TAB: DataTabInfo<PassChain> = {
  key: "pass-chains",
  label: "pass chains",
  shareTitle: "Pass Chain Analysis",
  storageKey: "shot-gobbler-pass-chains",
  filenamePrefix: "pass-chains-",
  codec: envelopeCodec<PassChain>("pass-chains"),
  validate: (data) => validateImport(data, "pass-chains"),
};
