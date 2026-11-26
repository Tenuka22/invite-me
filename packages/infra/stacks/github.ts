import * as Cloudflare from "@alchemy.run/cloudflare";
import * as GitHub from "@alchemy.run/github";
import * as Alchemy from "alchemy";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";

const owner = "Tenuka22";
const repository = "invite-me";

/**
 * One-off: mints a Cloudflare API token scoped to what the deploy needs and stores it, with the
 * account id, as the repository's Actions secrets. Run once; re-run only to rotate or change scope.
 *   alchemy deploy --config stacks/github.ts --stage github
 */
export default Alchemy.Stack(
  "invite-me-github",
  {
    providers: Layer.mergeAll(Cloudflare.providers(), GitHub.providers()),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const { accountId } = yield* yield* Cloudflare.CloudflareEnvironment;

    const apiToken = yield* Cloudflare.ApiToken.AccountApiToken("CIToken", {
      accountId,
      policies: [
        {
          effect: "allow",
          permissionGroups: [
            "Workers Scripts Write",
            "Workers KV Storage Write",
            "Workers R2 Storage Write",
            "D1 Write",
            "Queues Write",
            "Pages Write",
            "Account Settings Write",
            "Secrets Store Write",
            "Workers Tail Read",
          ],
          resources: { [`com.cloudflare.api.account.${accountId}`]: "*" },
        },
      ],
    });

    yield* GitHub.Secret("cf-api-token", {
      owner,
      repository,
      name: "CLOUDFLARE_API_TOKEN",
      value: apiToken.value,
    });
    yield* GitHub.Secret("cf-account-id", {
      owner,
      repository,
      name: "CLOUDFLARE_ACCOUNT_ID",
      value: Redacted.make(accountId),
    });
  }),
);
