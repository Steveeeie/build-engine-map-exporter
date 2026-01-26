interface GRPEntry {
  name: string;
  size: number;
  offset: number;
}

export interface GRPArchive {
  entries: Map<string, GRPEntry>;
  buffer: Buffer;
}

export function parseGRP(buffer: Buffer) {
  const signature = buffer.toString("ascii", 0, 12);

  if (signature !== "KenSilverman") {
    throw new Error("Invalid GRP file signature");
  }

  const fileCount = buffer.readInt32LE(12);
  const entries = new Map<string, GRPEntry>();
  const headerSize = 16;
  const entrySize = 16;

  let dataOffset = headerSize + fileCount * entrySize;

  for (let i = 0; i < fileCount; i++) {
    const entryOffset = headerSize + i * entrySize;

    const name = buffer
      .toString("ascii", entryOffset, entryOffset + 12)
      .replace(/\0/g, "")
      .toUpperCase()
      .trim();

    const size = buffer.readInt32LE(entryOffset + 12);

    entries.set(name, { name, size, offset: dataOffset });
    dataOffset += size;
  }

  return { entries, buffer };
}

export function getMapFileNames(archive: GRPArchive) {
  return Array.from(archive.entries.keys()).filter((name) =>
    name.endsWith(".MAP"),
  );
}

export function hasFile(archive: GRPArchive, name: string) {
  return archive.entries.has(name.toUpperCase());
}

export function extractFile(archive: GRPArchive, name: string) {
  const entry = archive.entries.get(name.toUpperCase());

  if (!entry) {
    throw new Error(`File not found in archive: ${name}`);
  }

  return new Uint8Array(archive.buffer.buffer, entry.offset, entry.size);
}
