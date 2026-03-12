import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";

function createDb() {
  if (!process.env.POSTGRES_URL) return null;
  // Dynamic import to avoid crash when env var is missing
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sql } = require("@vercel/postgres");
  return drizzle(sql, { schema });
}

export const db = createDb();
