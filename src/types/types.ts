export interface GwentPrize {
  name: string;
  quota: number;
  rarity: string;
}

export type QuizTaskStatus = "pending" | "completed" | (string & {});

export interface QuizTask {
  status: QuizTaskStatus;
}

export interface GwentStatus {
  enabled: boolean;
  charges_current: number;
  charges_max: number;
  next_available_at: number;
  cooldown_seconds: number;
  tasks?: {
    task3?: QuizTask;
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

export interface CheckInStatus {
  daily_completed: boolean;
  stats: {
    checked_in_today: boolean;
  };
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
