import { checkIn, drawAll, getUserdata, quizDaily } from "./api/api.js";
import { QUOTA_PER_CREDIT } from "./config.js";
import { SecretEntry, TypedSecret, UserContext } from "./types/types.js";
import secret from "../secrets/secret.json" with { type: "json" };

const Secret: TypedSecret = secret;

interface AccountResult {
  displayName: string;
  ok: boolean;
  error?: string;
}

function toUserContext(entry: SecretEntry): UserContext {
  return {
    session: entry.cookie.value,
    userId: entry.id,
    displayName: entry.displayName,
  };
}

async function claimForAccount(user: UserContext): Promise<void> {
  await quizDaily(user);
  await drawAll(user);
  await checkIn(user);

  const userdata = await getUserdata(user);
  if (!userdata.data) {
    throw new Error(
      userdata.message ?? "failed to get user data, check cookie",
    );
  }

  const credit = userdata.data.quota / QUOTA_PER_CREDIT;
  console.log(`[${user.displayName}] Credit: ${credit}`);
}

async function runAccount(
  key: string,
  entry: SecretEntry,
): Promise<AccountResult> {
  const user = toUserContext(entry);
  console.log(`[${user.displayName}] starting (${key})`);

  try {
    await claimForAccount(user);
    return { displayName: user.displayName, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${user.displayName}] failed: ${message}`);
    return { displayName: user.displayName, ok: false, error: message };
  }
}

function printSummary(results: AccountResult[]): void {
  console.log("\n=== Run summary ===");

  for (const result of results) {
    const status = result.ok ? "OK" : `FAILED (${result.error})`;
    console.log(`[${result.displayName}] ${status}`);
  }

  const succeeded = results.filter((result) => result.ok).length;
  console.log(
    `\nSucceeded: ${succeeded}, Failed: ${results.length - succeeded}`,
  );
}

const results: AccountResult[] = [];
for (const [key, entry] of Object.entries(Secret)) {
  results.push(await runAccount(key, entry));
}
printSummary(results);
