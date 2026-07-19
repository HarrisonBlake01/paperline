import { z } from "zod";

const Uuid = z.string().uuid();

export function parseUuidParam(value: string): string | null {
  const parsed = Uuid.safeParse(value);
  return parsed.success ? parsed.data : null;
}
