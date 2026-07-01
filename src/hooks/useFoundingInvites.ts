import { useCallback, useEffect, useState } from "react";
import { readFoundingInviteCodes, getOrSyncInviteCodes } from "@/lib/foundingInvites";
import {
  fetchFoundingInviteCodes,
  registerFoundingInviteCodes,
  getFoundingInviteRedemptions,
} from "@/backend/supabase/controllers/userExtrasController";

/**
 * Single source for a user's founding invite codes and which have been claimed.
 * Every surface that shows invite codes (dashboard Home hero + list, Profile)
 * uses this hook so the codes and their claimed/unclaimed state stay identical.
 */
export function useFoundingInvites(userId: string) {
  const [codes, setCodes] = useState<string[]>(() => (userId ? readFoundingInviteCodes(userId) : []));
  const [redeemedCodes, setRedeemedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    // Show the local codes immediately, then reconcile against Supabase.
    setCodes(readFoundingInviteCodes(userId));
    getOrSyncInviteCodes(userId, fetchFoundingInviteCodes, registerFoundingInviteCodes)
      .then(setCodes)
      .catch(() => {});
    getFoundingInviteRedemptions(userId)
      .then((redemptions) => setRedeemedCodes(new Set(redemptions.map((r) => r.referralCode.toUpperCase()))))
      .catch(() => {});
  }, [userId]);

  const isUsed = useCallback((code: string) => redeemedCodes.has(code.toUpperCase()), [redeemedCodes]);

  return { codes, redeemedCodes, isUsed };
}
