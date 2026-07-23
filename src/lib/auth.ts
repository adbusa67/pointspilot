import { User } from "../types/user";
import { defaultUsers } from "../data/defaultUsers";
import { getItem, setItem, removeItem } from "./storage";

/** localStorage keys — use exactly these strings. */
export const STORAGE_KEYS = {
  usersExtra: "pp_users_extra",
  session: "pp_session",
} as const;

/** Validation constraints (shared with the auth pages). */
export const VALIDATION = {
  passwordMinLength: 6,
  usernameMinLength: 2,
} as const;

export type RegisterInput = {
  email: string;
  password: string;
  username: string;
};

export type RegisterResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

export type LoginInput = {
  email: string;
  password: string;
};

/** Runtime-registered users (persisted in localStorage). */
function getExtraUsers(): User[] {
  return getItem<User[]>(STORAGE_KEYS.usersExtra) ?? [];
}

function saveExtraUsers(users: User[]): void {
  setItem(STORAGE_KEYS.usersExtra, users);
}

/** All known users = hardcoded defaults + runtime registrations. */
export function getAllUsers(): User[] {
  return [...defaultUsers, ...getExtraUsers()];
}

export function registerUser(input: RegisterInput): RegisterResult {
  const email = input.email.trim();
  const username = input.username.trim();
  const { password } = input;

  if (!email || !email.includes("@")) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (password.length < VALIDATION.passwordMinLength) {
    return {
      ok: false,
      error: `Password must be at least ${VALIDATION.passwordMinLength} characters.`,
    };
  }
  if (username.length < VALIDATION.usernameMinLength) {
    return {
      ok: false,
      error: `Username must be at least ${VALIDATION.usernameMinLength} characters.`,
    };
  }

  const emailExists = getAllUsers().some(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (emailExists) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const user: User = {
    id: "u" + Date.now(),
    email,
    password,
    username,
    avatarUrl: "https://i.pravatar.cc/150?u=" + encodeURIComponent(email),
    amexPoints: 0,
    aeroplanPoints: 0,
    updatedAt: new Date().toISOString(),
  };

  saveExtraUsers([...getExtraUsers(), user]);
  return { ok: true, user };
}

export function loginUser(input: LoginInput): User | null {
  const email = input.email.trim().toLowerCase();
  const match = getAllUsers().find(
    (u) => u.email.toLowerCase() === email && u.password === input.password,
  );
  return match ?? null;
}

export function saveSession(user: User): void {
  setItem(STORAGE_KEYS.session, user);
}

export function getSession(): User | null {
  return getItem<User>(STORAGE_KEYS.session);
}

export function logout(): void {
  removeItem(STORAGE_KEYS.session);
}

/**
 * Update a user's point balances.
 * - Persists to pp_users_extra when the user was registered at runtime.
 * - Always refreshes pp_session when it is the active user, so edits
 *   survive a page refresh for the logged-in user (including demo/default users).
 */
export function updateUserPoints(
  userId: string,
  amexPoints: number,
  aeroplanPoints: number,
): User | null {
  return updateUserProfile(userId, { amexPoints, aeroplanPoints });
}

/**
 * Apply a partial patch to a user's profile (balances, wallet, preferences).
 * - Persists to pp_users_extra when the user was registered at runtime.
 * - Always refreshes pp_session when it is the active user, so edits survive
 *   a page refresh for the logged-in user (including demo/default users).
 */
export function updateUserProfile(
  userId: string,
  patch: Partial<Omit<User, "id" | "updatedAt">>,
): User | null {
  const now = new Date().toISOString();

  // Try runtime users first.
  const extra = getExtraUsers();
  const idx = extra.findIndex((u) => u.id === userId);

  let updated: User | null = null;

  if (idx !== -1) {
    updated = { ...extra[idx], ...patch, updatedAt: now };
    extra[idx] = updated;
    saveExtraUsers(extra);
  } else {
    // Default (hardcoded) user — base off the current session or defaults.
    const base =
      getSession()?.id === userId
        ? getSession()
        : (defaultUsers.find((u) => u.id === userId) ?? null);
    if (base) {
      updated = { ...base, ...patch, updatedAt: now };
    }
  }

  if (!updated) return null;

  // Keep the active session in sync.
  if (getSession()?.id === userId) {
    saveSession(updated);
  }

  return updated;
}
