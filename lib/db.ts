import { createClient, type AntigravityClient, type QueryResult } from "@antigravity/sdk";

const projectId = process.env.ANTIGRAVITY_PROJECT_ID;
if (!projectId) {
  throw new Error("Missing ANTIGRAVITY_PROJECT_ID environment variable");
}

export const db: AntigravityClient = createClient(projectId);

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  try {
    const result: QueryResult<T> = await db.query<T>(sql, params);
    return result.rows;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[db] query failed: ${message}`);
  }
}
