import type { Config } from "drizzle-kit";

// Get AWS RDS credentials from environment
const host = process.env.AWS_RDS_HOST || '';
const port = process.env.AWS_RDS_PORT || '5432';
const database = process.env.AWS_RDS_DATABASE || '';
const username = process.env.AWS_RDS_USERNAME || '';
const password = process.env.AWS_RDS_PASSWORD || '';

export default {
  schema: "./shared/new-schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    host,
    port: parseInt(port),
    database,
    user: username,
    password,
    ssl: false,
  },
} satisfies Config;