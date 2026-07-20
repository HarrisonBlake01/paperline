import { z } from "zod";

// PostgreSQL accepts UUID-shaped identifiers without requiring RFC version or
// variant bits. Paperline's deterministic built-in/community template seeds use
// that valid database representation (for example, ...0001), so use Zod's
// generic GUID validator at database boundaries rather than z.uuid().
export const databaseIdSchema = z.guid();

export function parseUuidParam(value: string): string | null {
  const parsed = databaseIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
