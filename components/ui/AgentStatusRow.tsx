"use client";

import React from "react";
import { motion } from "framer-motion";

export type AgentId = "genesis" | "identity" | "pipeline" | "feasibility";
export type AgentStatus = "waiting" | "running" | "complete" | "failed";

export interface AgentStatusRowProps {
  agentId: AgentId;
  status: AgentStatus;
}

const AGENT_CONFIG: Record<AgentId, { name: string; color: string; icon: string }> = {
  genesis:     { name: "Genesis Engine",      color: "#5A8C6E", icon: "⬡" },
  identity:    { name: "Identity Architect",   color: "#5A6E8C", icon: "◇" },
  pipeline:    { name: "Production Pipeline",  color: "#8C7A5A", icon: "▲" },
  feasibility: { name: "Deep Validation",      color: "#7A5A8C", icon: "◈" },
};

export function AgentStatusRow({ agentId, status }: AgentStatusRowProps) {
  const config = AGENT_CONFIG[agentId];
  if (!config) return null;
  const accent = config.color;
  const isRunning = status === "running";

  return (
    <>
      <style>{`
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.5); opacity: 0.7; }
        }
        @keyframes pulseRing {
          0%   { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
      <motion.div
        layout
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.25 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: 12,
          background: isRunning ? `${accent}0a` : "transparent",
          border: isRunning ? `1px solid ${accent}28` : "1px solid transparent",
          width: "100%",
          boxSizing: "border-box",
          transition: "background 300ms, border-color 300ms",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Running shimmer stripe */}
        {isRunning && (
          <motion.div
            style={{
              position: "absolute",
              top: 0, left: 0, bottom: 0,
              width: 2,
              background: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
              borderRadius: "2px 0 0 2px",
            }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Left: Icon + Agent Name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: 8,
            background: `${accent}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12,
            color: accent,
            flexShrink: 0,
          }}>
            {config.icon}
          </div>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
            {config.name}
          </span>
        </div>

        {/* Status Badge */}
        {status === "waiting" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--nav-active)",
            color: "var(--muted)",
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: "11px", fontWeight: 500,
            letterSpacing: "0.02em",
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--muted)" }} />
            Queued
          </div>
        )}

        {status === "running" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: `${accent}18`,
            color: accent,
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.02em",
            boxShadow: `0 0 8px ${accent}30`,
          }}>
            <div style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
              <div style={{
                position: "absolute", inset: 0,
                borderRadius: "50%",
                background: accent,
                animation: "pulseDot 1.2s infinite ease-in-out",
              }} />
              <div style={{
                position: "absolute", inset: 0,
                borderRadius: "50%",
                border: `1.5px solid ${accent}`,
                animation: "pulseRing 1.2s infinite ease-out",
              }} />
            </div>
            Active
          </div>
        )}

        {status === "complete" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(90, 140, 110, 0.12)",
            color: "#5A8C6E",
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.02em",
          }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor">
              <path d="M8.33333 2.5L3.75 7.08333L1.66667 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Done
          </div>
        )}

        {status === "failed" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(220, 38, 38, 0.1)",
            color: "#dc2626",
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.02em",
          }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor">
              <path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Failed
          </div>
        )}
      </motion.div>
    </>
  );
}

export default AgentStatusRow;

