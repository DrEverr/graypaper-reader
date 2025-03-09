import { IDecoratedNote, NoteSource } from "../NotesProvider/types/DecoratedNote";
import type { IStorageNote } from "../NotesProvider/types/StorageNote";
import "./Label.css";
import { useMemo } from "react";

export type ILabel = {
  label: string;
  isActive: boolean;
  parent?: ILabel;
};

export function buildLabelHierarchy(labels: ILabel[], labelsToAdd: ILabel[], source?: NoteSource): ILabel[] {
  let parenLabel = source === NoteSource.Local ? "local" : source === NoteSource.Remote ? "remote" : undefined;
  for (const label of labelsToAdd) {
    const parts = label.label.trim().split("/");
    if (!parenLabel) parenLabel = parts[0];
    if (!parenLabel) continue;

    let parent = labels.find((label) => label.label === parenLabel);
    if (!parent) {
      parent = {
        label: parenLabel,
        isActive: label.isActive,
      };
      labels.push(parent);
    }
    for (const part of parts) {
      if (!part) {
        continue;
      }
      if (part === parenLabel) { // skip root label
        continue;
      }
      const currentPart = parenLabel + "/" + part;
      let child = labels.find((label) => label.label === currentPart && label.parent === parent);
      if (!child) {
        child = {
          label: currentPart,
          isActive: label.isActive,
          parent,
        };
        labels.push(child);
      }
      parent = child;
    }
  }

  return labels;
}

export function generateLabelTree(notes: IDecoratedNote[]): ILabel[] {
  let result = new Array<ILabel>();
  for (const note of notes) {
    result = buildLabelHierarchy(
      result,
      note.original.labels.map((label) => ({ label, isActive: true })),
      note.source,
    );
  }
  return result;
}

export function Label({ label, prefix = "" }: { label: ILabel; prefix?: string }) {
  const backgroundColor = useMemo(() => labelToColor(label.label), [label]);
  return (
    <span style={{ backgroundColor }} className="label">
      {prefix} {label.label.split("/").pop()}
    </span>
  );
}

export function LabelString({ label, prefix = "" }: { label: string; prefix?: string }) {
  const backgroundColor = useMemo(() => labelToColor(label), [label]);
  return (
    <span style={{ backgroundColor }} className="label">
      {prefix} {label}
    </span>
  );
}

function labelToColor(label: string) {
  return getColor(hashStringToIndex(label));
}

function getColor(index: number) {
  const size = 64;
  const hue = (index * (360 / size)) % 360;
  return hslToHex(hue, 90, 40);
}

// Function to hash a string to an index
function hashStringToIndex(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = hash * 31 + label.charCodeAt(i);
  }
  return hash;
}

function hslToHex(h: number, s: number, lightness: number) {
  const l = lightness / 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // Convert to hex and pad if necessary
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hasSomeLabel(label: string, labels: ILabel[]): boolean {
  return labels.some((l) => label === l.label);
}

function filterNotes(noteLabels: string[], labels: ILabel[], hasLabels: boolean): boolean {
  return hasLabels
    ? noteLabels.some((noteLabel) => hasSomeLabel(noteLabel, labels))
    : !noteLabels.some((noteLabel) => hasSomeLabel(noteLabel, labels));
}

export function filterNotesByLabels(
  notes: IStorageNote[],
  labels: ILabel[],
  { hasLabels }: { hasLabels: boolean } = {
    hasLabels: true,
  },
): IStorageNote[] {
  return notes.filter((note) => {
    return filterNotes(note.labels, labels, hasLabels);
  });
}

export function filterDecoratedNotesByLabels(
  labels: ILabel[],
  notes: IDecoratedNote[],
  { hasLabels }: { hasLabels: boolean } = {
    hasLabels: true,
  },
): IDecoratedNote[] {
  return notes.filter((note) => {
    return filterNotes(note.original.labels, labels, hasLabels);
  });
}
