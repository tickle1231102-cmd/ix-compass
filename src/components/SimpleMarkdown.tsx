"use client";

/** Lightweight markdown for AI Buddy — bold, lists, inline code, newlines. */
export function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-sm leading-relaxed text-ink">
      {lines.map((line, i) => {
        if (line.trim() === "") {
          return <div key={i} className="h-1" />;
        }
        if (line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-brand">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <code
          key={key++}
          className="rounded bg-line-soft px-1 py-0.5 font-mono text-xs text-brand-dark"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
