import { BASE_URL, DRAW_INTERVAL_MS } from "../config.js";
import {
  ApiRes,
  CheckInStatus,
  CheckInResult,
  DrawResult,
  GwentStatus,
  QuizAnswer,
  QuizResult,
  UserData,
  UserContext,
  SubscriptionStatus,
  ADTask,
} from "../types/types.js";

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function api<T>(
  { session, userId }: UserContext,
  path: string,
  init: RequestInit = {},
): Promise<ApiRes<T>> {
  const { headers: extraHeaders, ...rest } = init;

  const res = await fetch(path, {
    credentials: "include",
    ...rest,
    headers: {
      "New-Api-User": String(userId),
      "Cache-Control": "no-store",
      cookie: `session=${session}`,
      ...extraHeaders,
    },
  });

  const body: unknown = await res.json();
  debugLog(rest.method ?? "GET", path, res, body);
  return body as ApiRes<T>;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function assertSuccess<T>(res: ApiRes<T>, fallbackMessage: string): T {
  if (!res.success || !res.data)
    throw new Error(res.message ?? fallbackMessage);
  return res.data;
}

function log(user: UserContext, message: string): void {
  console.log(`[${user.displayName}] ${message}`);
}

function debugLog(
  method: string,
  path: string,
  res: Response,
  body: unknown,
): void {
  if (!process.env.DEBUG) return;

  console.log(`\n[debug] ${method} ${path} -> HTTP ${res.status}`);
  console.log(JSON.stringify(body, null, 2));
}

export async function getUserdata(
  user: UserContext,
): Promise<ApiRes<UserData>> {
  return api<UserData>(user, `${BASE_URL}/api/user/self`);
}

export async function watchAD(user: UserContext) {
  const status = assertSuccess(
    await api<GwentStatus>(user, `${BASE_URL}/api/gwent/status`),
    "Failed to get gwent status",
  );

  if (status.tasks?.task2) {
    const adTask = status.tasks.task2;

    if (adTask.suspended) {
      log(user, "ad task suspended, skipping");
      return;
    }

    if (adTask.next_available_at !== 0) {
      log(user, "ad task not available, skipping");
      return;
    }

    if (adTask.done_count >= adTask.daily_cap) {
      log(user, "ad task completed, skipping");
      return;
    }
  } else {
    log(user, "ad task not available, skipping");
    return;
  }

  const starttask = assertSuccess(
    await api<ADTask>(user, `${BASE_URL}/api/gwent/ad/start`, {
      method: "POST",
    }),
    "Failed to start ad",
  );

  setTimeout(
    async function () {
      try {
        assertSuccess(
          await api<ADTask>(user, `${BASE_URL}/api/gwent/ad/claim`, {
            method: "POST",
          }),
          "Failed to claim ad",
        );
      } catch (e: any) {
        log(user, "failed to claim ad", e);
      }
      log(user, "ad task completed");
    },
    (starttask.duration_sec + 1) * 1000,
  );
}

export async function subscription(user: UserContext) {
  const res = assertSuccess(
    await api<SubscriptionStatus>(user, `${BASE_URL}/api/subscription/self`),
    "Failed to get subscription status",
  );

  if (res.subscriptions.length === 0) {
    log(user, "no subscriptions found");
    return;
  }
  for (const { subscription } of res.subscriptions) {
    log(
      user,
      `subscription '${subscription.id}' using ${subscription.used_percent}% ( ${subscription.status} )`,
    );
  }
}

export async function checkIn(user: UserContext) {
  const status = assertSuccess(
    await api<CheckInStatus>(
      user,
      `${BASE_URL}/api/user/checkin?month=${currentMonth()}`,
    ),
    "Failed to get check-in status",
  );

  if (!status.stats) {
    throw new Error(
      `unexpected check-in status shape: ${JSON.stringify(status)}`,
    );
  }

  if (status.stats.checked_in_today) {
    log(user, "already checked in today");
    return;
  }

  const claim = assertSuccess(
    await api<CheckInResult>(user, `${BASE_URL}/api/user/checkin`, {
      method: "POST",
    }),
    "Failed to claim daily reward",
  );

  log(user, `claimed daily reward ( ${claim.reward_type} )`);
  await sleep(DRAW_INTERVAL_MS);
}

const QUIZ_ANSWERS: Record<string, number> = {
  "v9.11和v9.9谁大？": 0,
};

export async function quizDaily(user: UserContext) {
  const status = assertSuccess(
    await api<GwentStatus>(user, `${BASE_URL}/api/gwent/status`),
    "Failed to get gwent status",
  );

  if (status.tasks?.task3) {
    const quizTask = status.tasks?.task3;

    if (quizTask.suspended) {
      log(user, "ad task suspended, skipping");
      return;
    }

    if (quizTask.status !== "pending") {
      log(user, "quiz already completed today");
      return;
    }
  } else {
    log(user, "quiz task not available, skipping");
    return;
  }

  const quiz = assertSuccess(
    await api<QuizResult>(user, `${BASE_URL}/api/gwent/task3/start`, {
      method: "POST",
    }),
    "Failed to start quiz",
  );

  const answerIndex = QUIZ_ANSWERS[quiz.question.text] ?? 1;

  const answer = assertSuccess(
    await api<QuizAnswer>(user, `${BASE_URL}/api/gwent/task3/answer`, {
      method: "POST",
      body: JSON.stringify({ answer_index: answerIndex }),
    }),
    "Failed to submit quiz answer",
  );

  log(
    user,
    answer.correct ? "quiz answered correctly" : "quiz answered incorrectly",
  );
}

export async function drawAll(user: UserContext) {
  const status = assertSuccess(
    await api<GwentStatus>(user, `${BASE_URL}/api/gwent/status`),
    "Failed to get gwent status",
  );

  const { charges_current, next_available_at } = status;
  if (
    typeof charges_current !== "number" ||
    typeof next_available_at !== "number"
  ) {
    throw new Error(`unexpected gwent status shape: ${JSON.stringify(status)}`);
  }

  if (charges_current <= 0) {
    const nextTimeMs = next_available_at * 1000;
    const msRemaining = nextTimeMs - Date.now();

    if (msRemaining > 0) {
      const minutesTotal = Math.ceil(msRemaining / (1000 * 60));
      const hours = Math.floor(minutesTotal / 60);
      const minutes = minutesTotal % 60;
      log(user, `no charges left, next in ${hours}h ${minutes}m`);
    }
    return;
  }

  for (let i = 0; i < charges_current; i++) {
    const draw = assertSuccess(
      await api<DrawResult>(user, `${BASE_URL}/api/gwent/draw`, {
        method: "POST",
      }),
      "Failed to draw",
    );

    log(
      user,
      `drawn prize | (+${draw.prize?.quota} quota) [${draw.prize?.rarity}]`,
    );
    await sleep(DRAW_INTERVAL_MS);
  }
}
