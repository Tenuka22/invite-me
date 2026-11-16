import { defineConfig } from "drizzle-kit";

// Only used to generate SQL: Alchemy applies `src/migrations` to D1 on deploy/dev.
export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dialect: "sqlite",
});
