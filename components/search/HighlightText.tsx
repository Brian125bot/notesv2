"use client";

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightText({ text, query, className = "" }: HighlightTextProps) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Create a regex pattern that matches any of the terms
  const pattern = new RegExp(`(${terms.join("|")})`, "gi");

  // Split text by the pattern
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = terms.some(
          (term) => part.toLowerCase() === term.toLowerCase()
        );

        if (isMatch) {
          return (
            <mark
              key={index}
              className="bg-yellow-200 text-gray-900 rounded px-0.5"
            >
              {part}
            </mark>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
