import { pdf } from "@react-pdf/renderer";
import { ensureDocumentFontsRegistered } from "./fonts";

type PdfDocumentElement = NonNullable<Parameters<typeof pdf>[0]>;

/**
 * Renders a react-pdf `<Document>` element to a real `Blob` (task §10/§38) —
 * the single generation path shared by download and print, so both actions
 * always render the exact same bytes (§9: "same content that will be
 * exported"). Fonts are registered lazily on first use, client-side only.
 */
export async function generateDocumentBlob(element: PdfDocumentElement): Promise<Blob> {
  ensureDocumentFontsRegistered();
  return pdf(element).toBlob();
}

/**
 * Triggers a real browser download (§10) — no toast, no dead control. The
 * object URL is revoked shortly after the download starts (§35); browsers
 * already snapshot the blob when the download begins, so a short delay is
 * safe and avoids revoking before the save dialog/stream has started.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * Opens the browser's native print dialog on the generated PDF (§12) via a
 * hidden same-origin iframe pointed at a blob URL — no popup window (avoids
 * popup blockers), no second visually unrelated document (the iframe shows
 * the exact same PDF `Télécharger` would produce). Cleans up on `afterprint`
 * with a safety-net timeout for browsers that don't fire it for iframes.
 */
export function triggerBlobPrint(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  let cleaned = false;
  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    URL.revokeObjectURL(url);
    iframe.remove();
  }

  iframe.onload = () => {
    const contentWindow = iframe.contentWindow;
    if (!contentWindow) {
      cleanup();
      return;
    }
    contentWindow.addEventListener("afterprint", cleanup);
    contentWindow.focus();
    contentWindow.print();
  };

  document.body.appendChild(iframe);
  iframe.src = url;
  window.setTimeout(cleanup, 60_000);
}
