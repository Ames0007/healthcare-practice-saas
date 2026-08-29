/**
 * Filesystem-safe filename segment (task §11) — collapses anything outside
 * `[A-Za-z0-9-]` into a single `-`, and trims leading/trailing separators so
 * e.g. a patient number like "PAT-00281" or a reference like "FAC/2026/00143"
 * both produce a clean, unambiguous segment.
 */
export function sanitizeFilenameSegment(value: string): string {
  return value
    .replace(/[^A-Za-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Joins a prefix and one or more reference segments into `Prefix-SEG-SEG.pdf` (task §11 examples). */
export function buildDocumentFilename(prefix: string, ...segments: string[]): string {
  const cleanSegments = segments.map(sanitizeFilenameSegment).filter((segment) => segment.length > 0);
  return `${sanitizeFilenameSegment(prefix)}-${cleanSegments.join("-")}.pdf`;
}
