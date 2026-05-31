export type ClinicUser = {
  email: string;
  name: string;
  role: "MA" | "Admin" | "Provider";
  clinic: string;
};

export const DEMO_USERS: Record<string, { password: string; user: ClinicUser }> = {
  "emily.chen@bayarea-care.com": {
    password: "demo123",
    user: {
      email: "emily.chen@bayarea-care.com",
      name: "Emily Chen, MD",
      role: "Provider",
      clinic: "Bay Area Primary Care",
    },
  },
  "ma@bayarea-care.com": {
    password: "demo123",
    user: {
      email: "ma@bayarea-care.com",
      name: "Sarah Kim",
      role: "MA",
      clinic: "Bay Area Primary Care",
    },
  },
};

const SESSION_KEY = "authmatic_session";

export function login(email: string, password: string): ClinicUser | null {
  const entry = DEMO_USERS[email.toLowerCase().trim()];
  if (!entry || entry.password !== password) return null;
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(entry.user));
  }
  return entry.user;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function getSession(): ClinicUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ClinicUser;
  } catch {
    return null;
  }
}
