import {
  checkIn,
  drawAll,
  getUserdata,
  quizDaily,
  subscription,
  watchAD,
} from "./api/api.js";
import { QUOTA_PER_CREDIT } from "./config.js";
import { SecretEntry, TypedSecret, UserContext } from "./types/types.js";
import secret from "../secrets/secret.json" with { type: "json" };

const Secret: TypedSecret = secret;

export interface AccountResult {
  displayName: string;
  ok: boolean;
  error?: string;
}

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

function toUserContext(entry: SecretEntry): UserContext {
  return {
    session: entry.cookie.value,
    userId: entry.id,
    displayName: entry.displayName,
  };
}

async function claimForAccount(user: UserContext): Promise<void> {
  await quizDaily(user);
  await watchAD(user);
  await drawAll(user);
  // await checkIn(user);
  await subscription(user);

  const userdata = await getUserdata(user);
  if (!userdata.data) {
    throw new Error(
      userdata.message ?? "failed to get user data, check cookie",
    );
  }

  const credit = userdata.data.quota / QUOTA_PER_CREDIT;
  console.log(`[${user.displayName}] Credit: ${credit}`);
}

function getTime(): string {
  const now = new Date(Date.now());
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export async function runAccount(
  key: string,
  entry: SecretEntry,
): Promise<AccountResult> {
  const user = toUserContext(entry);
  console.log(`[${user.displayName}] starting (${key})`);

  try {
    await claimForAccount(user);
    console.log(`\n`);
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

while (true) {
  const results: AccountResult[] = [];
  for (const [key, entry] of Object.entries(Secret)) {
    results.push(await runAccount(key, entry));
  }
  printSummary(results);
  console.log(`At [${getTime()}]`);
  await sleep(10 * 60 * 1000);
}
