export type UserRole = "member" | "admin";
export type ModerationStatus = "active" | "warned" | "banned";
export type CommunityRequestStatus = "pending" | "approved" | "rejected";
export type ChatReportStatus = "open" | "dismissed" | "warned" | "banned";
export type IssueReportStatus = "open" | "dismissed" | "reviewed";

export interface PersistedUserRecord {
  id: string;
  username: string;
  role: UserRole;
  moderationStatus: ModerationStatus;
  warnings: number;
  createdAt: string;
  lastSeenAt: string;
  moderatedBy?: string;
  lastModeratedAt?: string;
}

export interface CommunityRequestRecord {
  id: string;
  requesterId: string;
  requesterName: string;
  communityName: string;
  genre: string;
  focusArea: string;
  audience: string;
  whyNow: string;
  samplePrompt: string;
  submittedAt: string;
  status: CommunityRequestStatus;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ChatReportRecord {
  id: string;
  communityId: string;
  communityTitle: string;
  messageId: string;
  messageText: string;
  reportedUserId: string;
  reportedUsername: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string;
  createdAt: string;
  status: ChatReportStatus;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface CommunityJoinRequestRecord {
  id: string;
  communityId: string;
  communityTitle: string;
  requesterId: string;
  requesterName: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface IssueReportRecord {
  id: string;
  reporterId: string;
  reporterName: string;
  issueType: string;
  details: string;
  screenshotDataUrl?: string;
  screenshotName?: string;
  pageUrl: string;
  userAgent: string;
  createdAt: string;
  status: IssueReportStatus;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AvatarCustomRequestRecord {
  id: string;
  requesterId: string;
  requesterName: string;
  description: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  reviewedBy?: string;
}

const USER_STORAGE_KEY = "raw.users.v1";
export const COMMUNITY_REQUESTS_STORAGE_KEY = "raw.community-requests.v1";
export const CHAT_REPORTS_STORAGE_KEY = "raw.chat-reports.v1";
export const COMMUNITY_JOIN_REQUESTS_STORAGE_KEY = "raw.community-join-requests.v1";
export const ISSUE_REPORTS_STORAGE_KEY = "raw.issue-reports.v1";
export const AVATAR_CUSTOM_REQUESTS_STORAGE_KEY = "raw.avatar-custom-requests.v1";

const ADMIN_USERNAMES = new Set(["admin", "rawadmin", "founder", "owner"]);

const memoryStore = {
  users: [] as PersistedUserRecord[],
  authSessionUserId: null as string | null,
  communityRequests: [] as CommunityRequestRecord[],
  chatReports: [] as ChatReportRecord[],
  communityJoinRequests: [] as CommunityJoinRequestRecord[],
  avatarCustomRequests: [] as AvatarCustomRequestRecord[],
  blockedWords: [] as string[],
};

function readJsonArray<T>(storageKey: string): T[] {
  if (storageKey === USER_STORAGE_KEY) {
    return [...memoryStore.users] as T[];
  }

  if (storageKey === COMMUNITY_REQUESTS_STORAGE_KEY) {
    return [...memoryStore.communityRequests] as T[];
  }

  if (storageKey === CHAT_REPORTS_STORAGE_KEY) {
    return [...memoryStore.chatReports] as T[];
  }

  if (storageKey === COMMUNITY_JOIN_REQUESTS_STORAGE_KEY) {
    return [...memoryStore.communityJoinRequests] as T[];
  }

  if (storageKey === AVATAR_CUSTOM_REQUESTS_STORAGE_KEY) {
    return [...memoryStore.avatarCustomRequests] as T[];
  }

  return [];
}

function writeJsonArray<T>(storageKey: string, entries: T[]): void {
  if (storageKey === USER_STORAGE_KEY) {
    memoryStore.users = entries as PersistedUserRecord[];
    return;
  }

  if (storageKey === COMMUNITY_REQUESTS_STORAGE_KEY) {
    memoryStore.communityRequests = entries as CommunityRequestRecord[];
    return;
  }

  if (storageKey === CHAT_REPORTS_STORAGE_KEY) {
    memoryStore.chatReports = entries as ChatReportRecord[];
  }

  if (storageKey === COMMUNITY_JOIN_REQUESTS_STORAGE_KEY) {
    memoryStore.communityJoinRequests = entries as CommunityJoinRequestRecord[];
  }

  if (storageKey === AVATAR_CUSTOM_REQUESTS_STORAGE_KEY) {
    memoryStore.avatarCustomRequests = entries as AvatarCustomRequestRecord[];
  }
}

function normalizeUsernameKey(username: string): string {
  return username.trim().toLowerCase();
}

export function toUserId(username: string): string {
  return `user-${normalizeUsernameKey(username).replace(/[^a-z0-9_-]/g, "-")}`;
}

export function resolveUserRole(username: string): UserRole {
  return ADMIN_USERNAMES.has(normalizeUsernameKey(username)) ? "admin" : "member";
}

export function readPersistedUsers(): PersistedUserRecord[] {
  return readJsonArray<PersistedUserRecord>(USER_STORAGE_KEY);
}

export function writePersistedUsers(users: PersistedUserRecord[]): void {
  writeJsonArray(USER_STORAGE_KEY, users);
}

export function getPersistedUserById(userId: string): PersistedUserRecord | null {
  return readPersistedUsers().find((user) => user.id === userId) ?? null;
}

export function getPersistedUserByUsername(username: string): PersistedUserRecord | null {
  const normalized = normalizeUsernameKey(username);
  return readPersistedUsers().find((user) => normalizeUsernameKey(user.username) === normalized) ?? null;
}

export function registerOrUpdateUser(username: string, role?: UserRole): PersistedUserRecord {
  const users = readPersistedUsers();
  const normalizedUsername = username.trim();
  const userId = toUserId(normalizedUsername);
  const now = new Date().toISOString();
  const existing = users.find((user) => user.id === userId);

  const nextUser: PersistedUserRecord = {
    id: userId,
    username: normalizedUsername,
    role: existing?.role ?? role ?? resolveUserRole(normalizedUsername),
    moderationStatus: existing?.moderationStatus ?? "active",
    warnings: existing?.warnings ?? 0,
    createdAt: existing?.createdAt ?? now,
    lastSeenAt: now,
    moderatedBy: existing?.moderatedBy,
    lastModeratedAt: existing?.lastModeratedAt,
  };

  writePersistedUsers([nextUser, ...users.filter((user) => user.id !== userId)]);
  return nextUser;
}

export function ensureUserRecord(username: string): PersistedUserRecord {
  return getPersistedUserByUsername(username) ?? registerOrUpdateUser(username, "member");
}

export function updateUserModerationStatus(
  userId: string,
  status: ModerationStatus,
  moderatedBy: string,
  warningIncrement = 0,
): PersistedUserRecord | null {
  const users = readPersistedUsers();
  const targetUser = users.find((user) => user.id === userId);
  if (!targetUser) {
    return null;
  }

  const nextUser: PersistedUserRecord = {
    ...targetUser,
    moderationStatus: status,
    warnings: status === "warned" ? targetUser.warnings + Math.max(warningIncrement, 1) : targetUser.warnings,
    moderatedBy,
    lastModeratedAt: new Date().toISOString(),
  };

  writePersistedUsers([nextUser, ...users.filter((user) => user.id !== userId)]);
  return nextUser;
}

export function persistAuthSession(userId: string): void {
  memoryStore.authSessionUserId = userId;
}

export function readAuthSession(): string | null {
  return memoryStore.authSessionUserId;
}

export function clearAuthSession(): void {
  memoryStore.authSessionUserId = null;
}

export function readCommunityRequests(): CommunityRequestRecord[] {
  return readJsonArray<CommunityRequestRecord>(COMMUNITY_REQUESTS_STORAGE_KEY);
}

export function writeCommunityRequests(requests: CommunityRequestRecord[]): void {
  writeJsonArray(COMMUNITY_REQUESTS_STORAGE_KEY, requests);
}

export function readChatReports(): ChatReportRecord[] {
  return readJsonArray<ChatReportRecord>(CHAT_REPORTS_STORAGE_KEY);
}

export function writeChatReports(reports: ChatReportRecord[]): void {
  writeJsonArray(CHAT_REPORTS_STORAGE_KEY, reports);
}

export function readCommunityJoinRequests(): CommunityJoinRequestRecord[] {
  return readJsonArray<CommunityJoinRequestRecord>(COMMUNITY_JOIN_REQUESTS_STORAGE_KEY);
}

export function writeCommunityJoinRequests(requests: CommunityJoinRequestRecord[]): void {
  writeJsonArray(COMMUNITY_JOIN_REQUESTS_STORAGE_KEY, requests);
}

export function readIssueReports(): IssueReportRecord[] {
  try {
    const raw = localStorage.getItem(ISSUE_REPORTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IssueReportRecord[]) : [];
  } catch {
    return [];
  }
}

export function writeIssueReports(reports: IssueReportRecord[]): void {
  localStorage.setItem(ISSUE_REPORTS_STORAGE_KEY, JSON.stringify(reports));
}

const ADMIN_POLLS_STORAGE_KEY = "raw.admin.polls.v1";

export interface AdminPollRecord {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  locked: boolean;
  createdAt: string;
}

export function readAdminPolls(): AdminPollRecord[] {
  try {
    const raw = localStorage.getItem(ADMIN_POLLS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminPollRecord[]) : [];
  } catch {
    return [];
  }
}

export function writeAdminPolls(polls: AdminPollRecord[]): void {
  localStorage.setItem(ADMIN_POLLS_STORAGE_KEY, JSON.stringify(polls));
}

export function createAdminPoll(question: string, optionTexts: string[]): AdminPollRecord {
  const id = crypto.randomUUID();
  const poll: AdminPollRecord = {
    id,
    question: question.trim(),
    options: optionTexts.map((text) => ({ id: crypto.randomUUID(), text: text.trim(), votes: 0 })),
    locked: false,
    createdAt: new Date().toISOString(),
  };
  writeAdminPolls([poll, ...readAdminPolls()]);
  return poll;
}

export function deleteAdminPoll(pollId: string): void {
  writeAdminPolls(readAdminPolls().filter((p) => p.id !== pollId));
}

export function formatAdminTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function readAvatarCustomRequests(): AvatarCustomRequestRecord[] {
  return readJsonArray<AvatarCustomRequestRecord>(AVATAR_CUSTOM_REQUESTS_STORAGE_KEY);
}

export function writeAvatarCustomRequests(requests: AvatarCustomRequestRecord[]): void {
  writeJsonArray(AVATAR_CUSTOM_REQUESTS_STORAGE_KEY, requests);
}

export function createAvatarCustomRequest(requesterId: string, requesterName: string, description: string): AvatarCustomRequestRecord {
  const id = crypto.randomUUID();
  const request: AvatarCustomRequestRecord = {
    id,
    requesterId,
    requesterName,
    description: description.trim(),
    submittedAt: new Date().toISOString(),
    status: "pending",
  };
  writeAvatarCustomRequests([request, ...readAvatarCustomRequests()]);
  return request;
}


function normalizeBlockedWord(word: string): string {
  return word.trim().toLowerCase();
}

export function readBlockedWords(): string[] {
  return [...memoryStore.blockedWords];
}

export function writeBlockedWords(words: string[]): void {
  const normalized = [...new Set(words.map(normalizeBlockedWord).filter(Boolean))].sort();
  memoryStore.blockedWords = normalized;
}
