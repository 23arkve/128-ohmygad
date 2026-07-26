export const queryKeys = {
  profile: {
    current: () => ["profile", "current"] as const,
    byUser: (userId: string) => ["profile", userId] as const,
  },
  events: {
    all: () => ["events"] as const,
    list: (filters?: Record<string, unknown>) => ["events", "list", filters] as const,
    detail: (id: string) => ["events", "detail", id] as const,
    registrations: (eventId: string) => ["events", eventId, "registrations"] as const,
    userRegistrations: (userId: string) => ["events", "user-registrations", userId] as const,
  },
  guidelines: {
    all: () => ["guidelines"] as const,
    detail: (id: string) => ["guidelines", id] as const,
  },
  surveys: {
    all: () => ["surveys"] as const,
    detail: (id: string) => ["surveys", id] as const,
    completionRates: () => ["surveys", "completion-rates"] as const,
  },
  users: {
    all: () => ["users"] as const,
    list: (params?: Record<string, unknown>) => ["users", "list", params] as const,
  },
  dashboard: {
    stats: () => ["dashboard", "stats"] as const,
  },
};
