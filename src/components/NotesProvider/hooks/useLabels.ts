import { useCallback, useEffect, useMemo, useState } from "react";
import { type ILabel, filterDecoratedNotesByLabels, generateLabelTree } from "../../Label/Label";
import { LABEL_LOCAL, LABEL_REMOTE } from "../consts/labels";
import type { IDecoratedNote } from "../types/DecoratedNote";
import { loadFromLocalStorage, saveToLocalStorage } from "../utils/labelsLocalStorage";

/**
 * Filter out labels
 * @param labels - list of labels to filter
 * @param onlyNonEditable - if true, only non-editable labels are returned (like remote/local/imported:)
 * @returns
 */
export function getEditableLabels(
  labels: string[],
  { onlyNonEditable }: { onlyNonEditable: boolean } = { onlyNonEditable: false },
) {
  return labels.filter((label) => {
    if (label === LABEL_LOCAL || label === LABEL_REMOTE) {
      return onlyNonEditable;
    }
    return !onlyNonEditable;
  });
}

/**
 * Maintains a list list of all labels (across all nodes) and allow to activate/deactivate them
 * to filter given list of all decorated notes.
 */
export function useLabels(allNotes: IDecoratedNote[]): [IDecoratedNote[], ILabel[], (label: ILabel) => void] {
  const [storageLabels, setStorageLabels] = useState<ILabel[]>([]);
  const [labels, setLabels] = useState<ILabel[]>([]);

  // load and save storage labels to Local Storage
  useEffect(() => {
    setStorageLabels(loadFromLocalStorage());
  }, []);
  useEffect(() => {
    if (storageLabels.length) {
      saveToLocalStorage(storageLabels);
    }
  }, [storageLabels]);

  // toggle label visibility
  const toggleLabel = useCallback((label: ILabel) => {
    const toggle = (x: ILabel) => {
      if (x.label === label.label && x.parent === label.parent) {
        return {
          ...x,
          isActive: !x.isActive,
        };
      }
      return x;
    };

    let newLabel: ILabel | null = null;
    setLabels((prev) => {
      const newLabels = prev.map(toggle);
      newLabel = newLabels.find((x) => x.label === label.label) || null;
      return newLabels;
    });
    setStorageLabels((storageLabels) => {
      if (storageLabels.find((x) => x.label === label.label) !== undefined) {
        return storageLabels.map(toggle);
      }
      if (newLabel !== null) {
        return [...storageLabels, newLabel];
      }
      return storageLabels;
    });
  }, []);

  // maintain a set of labels inactive in local storage.
  const storageActivity = useMemo(() => {
    const result = new Map<string, boolean>();
    for (const label of storageLabels) {
      result.set(label.label, label.isActive);
    }
    return result;
  }, [storageLabels]);

  // Re-create labels on change in notes
  useEffect(() => {
    setLabels(
      generateLabelTree(allNotes).map((label) => {
        const isActive = storageActivity.get(label.label) || true;
        return {
          ...label,
          isActive,
        };
      }),
    );
  }, [allNotes, storageActivity]);

  // filter notes when labels are changing
  const filteredNotes = useMemo(() => {
    return filterDecoratedNotesByLabels(labels, allNotes, { hasLabels: true });
  }, [labels, allNotes]);

  return [filteredNotes, labels, toggleLabel];
}
