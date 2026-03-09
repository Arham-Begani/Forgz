import { query } from "./db";

// -- Types (from VENTURE_OBJECT.md) --

export interface Venture {
  ventureId: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  conversations: Record<string, Conversation[]>;
  context: {
    research: Record<string, unknown> | null;
    branding: Record<string, unknown> | null;
    marketing: Record<string, unknown> | null;
    landing: Record<string, unknown> | null;
    feasibility: Record<string, unknown> | null;
  };
}

export interface Conversation {
  conversationId: string;
  moduleId: string;
  prompt: string;
  status: "running" | "complete" | "failed";
  streamOutput: string[];
  result: Record<string, unknown>;
  createdAt: string;
}

// -- Row shapes returned by SQL --

interface VentureRow {
  id: string;
  user_id: string;
  name: string;
  context: Venture["context"];
  created_at: string;
  updated_at: string;
}

interface ConversationRow {
  id: string;
  venture_id: string;
  module_id: string;
  prompt: string;
  status: "running" | "complete" | "failed";
  stream_output: string[];
  result: Record<string, unknown>;
  created_at: string;
}

// -- Row mappers --

function toVenture(row: VentureRow): Venture {
  return {
    ventureId: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    conversations: {},
    context: row.context,
  };
}

function toConversation(row: ConversationRow): Conversation {
  return {
    conversationId: row.id,
    moduleId: row.module_id,
    prompt: row.prompt,
    status: row.status,
    streamOutput: row.stream_output,
    result: row.result,
    createdAt: row.created_at,
  };
}

// -- Venture queries --

export async function createVenture(
  userId: string,
  name: string,
): Promise<Venture> {
  const rows = await query<VentureRow>(
    `INSERT INTO ventures (user_id, name)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, name],
  );
  return toVenture(rows[0]);
}

export async function getVenturesByUser(userId: string): Promise<Venture[]> {
  const rows = await query<VentureRow>(
    `SELECT * FROM ventures WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return rows.map(toVenture);
}

export async function getVenture(
  id: string,
  userId: string,
): Promise<Venture | null> {
  const rows = await query<VentureRow>(
    `SELECT * FROM ventures WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return rows.length ? toVenture(rows[0]) : null;
}

export async function updateVentureContext(
  id: string,
  contextKey: string,
  value: unknown,
): Promise<void> {
  await query(
    `UPDATE ventures
     SET context = jsonb_set(context, $2::text[], $3::jsonb)
     WHERE id = $1`,
    [id, `{${contextKey}}`, JSON.stringify(value)],
  );
}

export async function updateVentureName(
  id: string,
  name: string,
): Promise<void> {
  await query(`UPDATE ventures SET name = $1 WHERE id = $2`, [name, id]);
}

export async function deleteVenture(id: string): Promise<void> {
  await query(`DELETE FROM ventures WHERE id = $1`, [id]);
}

// -- Conversation queries --

export async function createConversation(
  ventureId: string,
  moduleId: string,
  prompt: string,
): Promise<Conversation> {
  const rows = await query<ConversationRow>(
    `INSERT INTO conversations (venture_id, module_id, prompt)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [ventureId, moduleId, prompt],
  );
  return toConversation(rows[0]);
}

export async function updateConversationStatus(
  id: string,
  status: "running" | "complete" | "failed",
): Promise<void> {
  await query(`UPDATE conversations SET status = $1 WHERE id = $2`, [
    status,
    id,
  ]);
}

export async function appendStreamLine(
  id: string,
  line: string,
): Promise<void> {
  await query(
    `UPDATE conversations
     SET stream_output = stream_output || $1::jsonb
     WHERE id = $2`,
    [JSON.stringify([line]), id],
  );
}

export async function setConversationResult(
  id: string,
  result: Record<string, unknown>,
): Promise<void> {
  await query(`UPDATE conversations SET result = $1::jsonb WHERE id = $2`, [
    JSON.stringify(result),
    id,
  ]);
}

export async function getConversationsByModule(
  ventureId: string,
  moduleId: string,
): Promise<Conversation[]> {
  const rows = await query<ConversationRow>(
    `SELECT * FROM conversations
     WHERE venture_id = $1 AND module_id = $2
     ORDER BY created_at ASC`,
    [ventureId, moduleId],
  );
  return rows.map(toConversation);
}
