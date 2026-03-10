"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

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
          background: "rgba(13, 13, 13, 0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
            background: "rgba(255, 255, 255, 0.02)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: moduleAccent,
              boxShadow: `0 0 8px ${moduleAccent}`,
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            Agent Research Process
          </span>
        </div>

        <div
          ref={scrollRef}
          className="forge-stream-scroll"
          style={{
            maxHeight: "320px",
            overflowY: "auto",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "13px",
            lineHeight: 1.6,
            padding: "12px 0",
          }}
        >
          {lines.length === 0 ? (
            <div
              style={{
                color: "rgba(255, 255, 255, 0.3)",
                padding: "0 16px",
                fontStyle: "italic",
              }}
            >
              Initializing genesis engine...
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {lines
                .filter((line) => {
                  // Filter out raw JSON markers to keep the stream clean
                  const trimmed = line.trim();
                  if (trimmed === "{" || trimmed === "}" || trimmed === "],")
                    return false;
                  if (trimmed.startsWith('"') && trimmed.endsWith('":'))
                    return false;
                  return true;
                })
                .map((line, index) => {
                  const isLast = index === lines.length - 1;
                  const showHighlight = isLast && !isComplete;

                  // Remove trailing quotes/commas if they look like JSON fragments
                  const cleanLine = line.trim().replace(/^"/, "").replace(/"[,]?$/, "");

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      style={{
                        backgroundColor: showHighlight
                          ? `${moduleAccent}10`
                          : "transparent",
                        padding: "4px 20px",
                        position: "relative",
                        borderLeft: showHighlight
                          ? `2px solid ${moduleAccent}`
                          : "2px solid transparent",
                      }}
                    >
                      <div
                        style={{
                          color: isLast
                            ? "rgba(255, 255, 255, 0.9)"
                            : "rgba(255, 255, 255, 0.6)",
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                          fontWeight: isLast ? 400 : 300,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {cleanLine}
                      </div>
                    </motion.div>
                  );
                })}
              {!isComplete && (
                <div style={{ padding: "8px 20px" }}>
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      fontSize: "12px",
                      color: moduleAccent,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>●</span>
                    <span style={{ fontSize: "11px", fontWeight: 500 }}>
                      Synthesizing findings...
                    </span>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default MessageStream;
