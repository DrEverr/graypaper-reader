import fs, { readFileSync } from "node:fs";
import path from "node:path";
import type { INoteV3, INotesEnvelopeV3, Metadata } from "@fluffylabs/links-metadata";
import { fetchMetadata, findLinkToLatestVersion } from "@fluffylabs/links-metadata";

/**
 * Convert messages.json file generated by the tool into Reader notes format
 * so it can be imported or loaded as remote content.
 */
type Message = {
  /** ISO date. */
  date: string;
  /** Matrix handle */
  sender: string;
  /** Link to matrix message. */
  link: string;
  /** Content of the message. */
  msg: string;
};

export function saveNotes(notes: INotesEnvelopeV3, outputFilename: string) {
  fs.writeFileSync(path.resolve(outputFilename), JSON.stringify(notes));
  console.info(`💾 Saved ${notes.notes.length} notes to ${outputFilename}.`);
}

export async function convertToNotes(meta: Metadata, file: string, labels?: string[]) {
  const data = JSON.parse(readFileSync(path.resolve(file), "utf-8")) as Message[];

  const notes = new Map<string, INoteV3>();
  for (const msg of data) {
    const linkData = findAndParseLink(msg.msg, meta);
    if (!linkData) {
      continue;
    }

    const date = new Date(msg.date).getTime();
    const content = `${msg.link}\n\n---\n${msg.msg}`;
    // if we already have note for this link, ammend it.
    const prevNote = notes.get(linkData.url);
    if (prevNote) {
      // update date
      prevNote.date = date;
      // add another author
      prevNote.author += `, ${msg.sender}`;
      // add content
      prevNote.content = `${content}\n---\n${prevNote.content}`;
    } else {
      notes.set(linkData.url, {
        noteVersion: 3,
        content,
        date,
        author: msg.sender,
        ...linkData,
        labels: labels ?? [],
      });
    }
  }

  const notesArray = Array.from(notes.values());
  const envelope: INotesEnvelopeV3 = {
    version: 3,
    notes: notesArray,
  };

  return envelope;
}

function findAndParseLink(content: string, meta: Metadata) {
  const link = findLinkToLatestVersion(content, meta);

  if (!link) {
    return null;
  }

  return {
    url: link.url,
    version: link.version,
    selectionStart: link.selectionStart,
    selectionEnd: link.selectionEnd,
  };
}

async function main(inputFilename: string, outputFilename: string) {
  const meta = await fetchMetadata();
  const notes = await convertToNotes(meta, inputFilename);
  saveNotes(notes, outputFilename);
}

if (require.main === module) {
  main(process.argv[2], process.argv[3]);
}
