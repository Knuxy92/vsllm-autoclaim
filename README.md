# vsllm-autoclaim

Personal daily auto-claim script for https://vsllm.com.

## What it does

For each account saved in `secrets/secret.json` it:

1. Runs the daily quiz when the API offers one (`tasks.task3` is optional — no task, nothing to do). The answer comes from the `QUIZ_ANSWERS` table; unknown questions fall back to answer index 1.
2. Draws all available gwent charges (1s between draws).
3. Checks in.
4. Prints the remaining credit for the account.

Accounts are processed independently: one failing (e.g. expired session cookie) does not stop the others.

## Prerequisites

- Node 24+
- pnpm 11

## Setup

```sh
pnpm install
```

Create `secrets/secret.json` (gitignored). It is a cookie export captured from browser devtools, keyed by user id. Easiest: copy the shape of an existing entry and replace the values. Minimal redacted example:

```json
{
  "123456": {
    "cookie": {
      "value": "<session cookie value>",
      "domain": "vsllm.com",
      "expirationDate": 0,
      "httpOnly": true,
      "path": "/",
      "sameSite": "lax",
      "secure": true
    },
    "displayName": "...",
    "id": 123456,
    "name": "...",
    "savedAt": 0,
    "userJson": "...",
    "username": "..."
  }
}
```

The top-level key is the numeric user id; only `cookie.value` and `displayName` matter at runtime.

## Run

```sh
pnpm start        # tsx src/main.ts
pnpm typecheck
```

## Maintenance notes

- **Expired cookie** — session cookies expire. Re-capture the `session` cookie from browser devtools while logged in to vsllm.com and replace `cookie.value` for that account. An expired cookie shows up as a failed account in the output.
- **New account** — add a new top-level entry to `secrets/secret.json`, keyed by the new user id, matching the entry shape above.
- **New quiz question** — add the exact question text as the key and the correct answer index as the value in `QUIZ_ANSWERS` (`src/api/api.ts`). Question text must match what the API returns; anything unmapped answers index 1.
- **Tuning** — `BASE_URL`, `QUOTA_PER_CREDIT`, and `DRAW_INTERVAL_MS` live in `src/config.ts`.
