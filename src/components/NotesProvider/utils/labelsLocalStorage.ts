import { type ILabel, buildLabelHierarchy } from "../../Label/Label";

const LOCAL_STORAGE_KEY = "labels-v2";

function isLabel(x: unknown): x is ILabel {
  if (x === null || typeof x !== "object") {
    return false;
  }
  if (!("label" in x && typeof x.label === "string")) {
    return false;
  }
  if (!("isActive" in x && typeof x.isActive === "boolean")) {
    return false;
  }
  return true;
}

export function loadFromLocalStorage(): ILabel[] {
  try {
    const labelsStr = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    const labels = JSON.parse(labelsStr || "[]");
    if (!Array.isArray(labels)) {
      return [];
    }
    // getting labels from local storage
    const labelsStorage = labels.filter((x) => isLabel(x)) as ILabel[];
    // building and returning labels with tree structure
    return buildLabelHierarchy([], labelsStorage);
  } catch (e) {
    console.warn("Error reading labels", e);
    return [];
  }
}

export function saveToLocalStorage(labels: ILabel[]) {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(labels));
  } catch (e) {
    console.error("Unable to save labels state", e);
  }
}
