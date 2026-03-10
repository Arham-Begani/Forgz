"use client";

import { useRef, useEffect } from "react";

interface MessageStreamProps {
  lines: string[];
  moduleAccent: string;
  isComplete: boolean;
}

export function MessageStream({
  lines,
  moduleAccent,
  isComplete,
}: MessageStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lines.length]);

  return (
    <>
      <style>{`
        .forge-stream-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .forge-stream-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .forge-stream-scroll::-webkit-scrollbar-thumb {
          background: rgba(120, 118, 114, 0.2);
          border-radius: 2px;
        }
        .forge-stream-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(120, 118, 114, 0.2) transparent;
        }
      `}</style>

      <div
        style={{
          background: "var(--stream-bg)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
        }}
      >
        <div
          ref={scrollRef}
          className="forge-stream-scroll"
          style={{
            maxHeight: "320px",
            overflowY: "auto",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            lineHeight: 1.6,
            padding: "16px 0",
          }}
        >
          {lines.length === 0 ? (
            <div style={{ color: "var(--muted)", padding: "0 16px" }}>
              Initializing...
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {lines.map((line, index) => {
                const isLast = index === lines.length - 1;
                const showHighlight = isLast && !isComplete;

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      backgroundColor: showHighlight
                        ? `${moduleAccent}14`
                        : "transparent",
                      borderLeft: showHighlight
                        ? `2px solid ${moduleAccent}`
                        : "2px solid transparent",
                      padding: "2px 16px 2px 14px",
                    }}
                  >
                    <div
                      style={{
                        width: "3ch",
                        color: "var(--muted)",
                        flexShrink: 0,
                        marginRight: "16px",
                        textAlign: "right",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div
                      style={{
                        color: "var(--stream-text)",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {line}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default MessageStream;
