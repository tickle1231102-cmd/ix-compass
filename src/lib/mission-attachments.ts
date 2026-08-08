import type { MissionAttachment, MissionAttachmentKind } from "./types";

const MAX_STORE_BYTES = 700_000;
const MAX_TEXT_CHARS = 6_000;

export function attachmentKind(
  name: string,
  mimeType: string
): MissionAttachmentKind {
  const lower = name.toLowerCase();
  const mime = mimeType.toLowerCase();
  if (mime.includes("pdf") || lower.endsWith(".pdf")) return "pdf";
  if (
    mime.includes("word") ||
    mime.includes("msword") ||
    mime.includes("officedocument.wordprocessing") ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx")
  ) {
    return "word";
  }
  if (
    mime.startsWith("text/") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md")
  ) {
    return "text";
  }
  return "other";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export async function fileToAttachment(file: File): Promise<MissionAttachment> {
  const kind = attachmentKind(file.name, file.type);
  const base: MissionAttachment = {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    kind,
  };

  if (kind === "text" || file.type.startsWith("text/")) {
    const text = await readAsText(file);
    return {
      ...base,
      textContent: text.slice(0, MAX_TEXT_CHARS),
    };
  }

  if (file.size <= MAX_STORE_BYTES) {
    const dataUrl = await readAsDataUrl(file);
    return { ...base, dataUrl };
  }

  return base;
}

export function makeTextAttachment(
  text: string,
  fileName = "제출-텍스트.txt"
): MissionAttachment | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return {
    id: `att-text-${Date.now()}`,
    name: fileName,
    mimeType: "text/plain",
    size: new Blob([trimmed]).size,
    kind: "text",
    textContent: trimmed.slice(0, MAX_TEXT_CHARS),
  };
}

export const ACCEPT_DELIVERABLES =
  ".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";
