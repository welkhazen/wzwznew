import type { ReferralActivationRecord, UserRecord } from "../types";
import {
  createUser,
  findUserByReferralCode,
  findUserById,
  findUserByUsername,
  listReferralActivationsForInviter,
  phoneHashExists,
  recordReferralActivation,
  updateUserPasswordHash,
  updateUserProfile,
  usernameExists,
  type UpdateUserProfileInput,
} from "./store";

type CreateUserInput = {
  username: string;
  passwordHash: string;
  phoneHash: string;
  referralCode?: string;
};

type UpdateProfileResult =
  | { status: "ok"; user: UserRecord }
  | { status: "not_found" | "username_taken" };

export interface UserRepository {
  findById(userId: string): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByReferralCode(referralCode: string): Promise<UserRecord | null>;
  usernameExists(username: string): Promise<boolean>;
  phoneHashExists(phoneHash: string): Promise<boolean>;
  create(input: CreateUserInput): Promise<UserRecord>;
  registerReferralActivation(referralCode: string, referredUserId: string): Promise<void>;
  listReferralActivations(userId: string): Promise<ReferralActivationRecord[]>;
  updateProfile(userId: string, updates: UpdateUserProfileInput): Promise<UpdateProfileResult>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<boolean>;
}

class MemoryUserRepository implements UserRepository {
  async findById(userId: string): Promise<UserRecord | null> {
    return findUserById(userId);
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    return findUserByUsername(username);
  }

  async findByEmail(_email: string): Promise<UserRecord | null> {
    return null;
  }

  async findByReferralCode(referralCode: string): Promise<UserRecord | null> {
    return findUserByReferralCode(referralCode);
  }

  async usernameExists(username: string): Promise<boolean> {
    return usernameExists(username);
  }

  async phoneHashExists(userPhoneHash: string): Promise<boolean> {
    return phoneHashExists(userPhoneHash);
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    return createUser(input.username, input.passwordHash, input.phoneHash, input.referralCode);
  }

  async registerReferralActivation(referralCode: string, referredUserId: string): Promise<void> {
    recordReferralActivation(referralCode, referredUserId);
  }

  async listReferralActivations(userId: string): Promise<ReferralActivationRecord[]> {
    return listReferralActivationsForInviter(userId);
  }

  async updateProfile(userId: string, updates: UpdateUserProfileInput): Promise<UpdateProfileResult> {
    const result = updateUserProfile(userId, updates);
    if (result.status !== "ok" || !result.user) {
      return { status: result.status };
    }

    return { status: "ok", user: result.user };
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<boolean> {
    return updateUserPasswordHash(userId, passwordHash);
  }
}

let repository: UserRepository | null = null;

export function getUserRepository(): UserRepository {
  if (repository) {
    return repository;
  }

  repository = new MemoryUserRepository();
  return repository;
}
