import { User } from "../types/user";

export const defaultUsers: User[] = [
  {
    id: "u1",
    email: "demo@pointpilot.com",
    password: "demo123",
    username: "Demo User",
    avatarUrl: "https://i.pravatar.cc/150?u=demo",
    amexPoints: 128450,
    aeroplanPoints: 95200,
    updatedAt: "2026-07-23T12:00:00.000Z",
  },
  {
    id: "u2",
    email: "jane@pointpilot.com",
    password: "password",
    username: "Jane Doe",
    avatarUrl: "https://i.pravatar.cc/150?u=jane",
    amexPoints: 85000,
    aeroplanPoints: 120300,
    updatedAt: "2026-07-23T12:00:00.000Z",
  },
];
