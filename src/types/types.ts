export interface GwentPrize {
  name: string;
  quota: number;
  rarity: string;
}

export type QuizTaskStatus = "pending" | "completed" | (string & {});

export interface QuizTask {
  status: QuizTaskStatus;
  suspended: boolean;
}

export interface GwentStatus {
  enabled: boolean;
  charges_current: number;
  charges_max: number;
  next_available_at: number;
  cooldown_seconds: number;
  tasks?: {
    task3?: QuizTask;
    task2?: ADTask;
  };
}

export interface QuizResult {
  question: {
    text: string;
    options: string[];
  };
  started_at: number;
  time_limit_sec: number;
}

export interface QuizAnswer {
  correct: boolean;
}

export interface SubscriptionStatus {
  subscriptions: {
    subscription: {
      id: number;
      plan_id: number;
      status: string;
      source: string;
      start_time: number;
      end_time: number;
      last_reset_time: number;
      next_reset_time: number;
      upgrade_group: string;
      consume_priority: number;
      used_percent: number;
      unlimited: boolean;
    };
  }[];
}

export interface CheckInStatus {
  daily_completed: boolean;
  stats: {
    checked_in_today: boolean;
  };
}

export interface ADTask {
  done_count: number;
  suspended: boolean;
  duration_sec: number;
  next_available_at: number;
  daily_cap: number;
}

export interface CheckInResult {
  reward_type: string;
  reward_amount: number;
}

export interface DrawResult {
  prize?: GwentPrize;
  charges_current?: number;
  next_available_at?: number;
}

export interface ApiRes<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface UserContext {
  session: string;
  userId: number;
  displayName: string;
}

export interface SecretEntry {
  cookie: {
    domain: string;
    expirationDate: number;
    httpOnly: boolean;
    path: string;
    sameSite: string;
    secure: boolean;
    value: string;
  };
  displayName: string;
  id: number;
  name: string;
  savedAt: number;
  userJson: string;
  username: string;
}

export type TypedSecret = Record<string, SecretEntry>;

export interface UserData {
  id: number;
  quota: number;
  request_count: number;
  role: number;
  status: number;
}
