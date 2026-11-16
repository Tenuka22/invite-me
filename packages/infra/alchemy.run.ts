import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Neon from "@alchemy.run/neon";
import * as Alchemy from "alchemy";
import * as Output from "alchemy/Output";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import "varlock/auto-load";

const managedDatabase = Effect.gen(function* () {
  const database = yield* Neon.Project("database", {
    historyRetentionSeconds: 21600,
    migrations: "../../packages/db/src/migrations",
  });
  const runtimeUrl = database.pooledConnectionUri.pipe(Output.map(Redacted.make));

  return {
    runtimeEnv: { DATABASE_URL: runtimeUrl },
  };
});

export const databaseEnv = managedDatabase.pipe(Effect.map(({ runtimeEnv }) => runtimeEnv));

export const databaseBindings = {
  DATABASE_URL: databaseEnv.pipe(Effect.map(({ DATABASE_URL }) => DATABASE_URL)),
};

export const databaseProviders = Layer.mergeAll(Neon.providers());

export const server = Cloudflare.Worker("server", {
  main: "../../apps/server/src/index.ts",
  compatibility: {
    flags: ["nodejs_compat"],
  },
  env: {
    ...databaseBindings,
    CORS_ORIGIN: Config.String("CORS_ORIGIN"),
    BETTER_AUTH_SECRET: Config.Redacted("BETTER_AUTH_SECRET"),
    GOOGLE_CLIENT_ID: Config.String("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: Config.Redacted("GOOGLE_CLIENT_SECRET"),
    EMAIL_PROVIDER: Config.String("EMAIL_PROVIDER").pipe(Config.withDefault("console")),
    RESEND_API_KEY: Config.Redacted("RESEND_API_KEY").pipe(
      Config.withDefault(Redacted.make("")),
    ),
    EMAIL_FROM: Config.String("EMAIL_FROM").pipe(Config.withDefault("")),
    BETTER_AUTH_URL: Cloudflare.Worker.URL,
  },
  dev: {
    port: 3000,
  },
});

export type ServerEnv = Cloudflare.InferEnv<typeof server>;

export default Alchemy.Stack(
  "invite-me",
  {
    providers: Layer.mergeAll(Cloudflare.providers(), databaseProviders),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const serverWorker = yield* server;
    const webWorker = yield* Cloudflare.Website.Vite("web", {
      rootDir: "../../apps/web",
      compatibility: {
        flags: ["nodejs_compat", "global_fetch_strictly_public"],
      },
      env: {
        VITE_SERVER_URL: serverWorker.url.as<string>(),
      },
      dev: {
        port: 3001,
      },
    });

    return {
      web: webWorker.url,
      server: serverWorker.url,
    };
  }),
);
