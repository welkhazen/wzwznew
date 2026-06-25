import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createAvatarCustomRequest } from "@/lib/adminData";

interface AvatarCustomRequestModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AvatarCustomRequestModal({
  userId,
  userName,
  isOpen,
  onClose,
}: AvatarCustomRequestModalProps) {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe your custom avatar idea.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      createAvatarCustomRequest(userId, userName, description);
      toast({
        title: "Request submitted!",
        description: "Our team will review your custom avatar idea soon.",
      });
      setDescription("");
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-w-md w-full mx-4 rounded-2xl border border-raw-border/35 bg-raw-surface p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-raw-silver/50 hover:text-raw-silver"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold text-raw-text mb-2">Request Custom Avatar</h2>
        <p className="text-sm text-raw-silver/60 mb-4">
          Submit your custom avatar design idea for the S1 tier (40,000 tokens).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-raw-silver/70 mb-2">
              Avatar Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your custom avatar design, style, colors, theme, or any specific ideas..."
              className="w-full rounded-lg border border-raw-border/35 bg-raw-black/50 px-3 py-2 text-sm text-raw-text placeholder-raw-silver/30 focus:border-raw-gold/50 focus:outline-none"
              rows={5}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-raw-border/35 bg-raw-black/30 px-4 py-2 text-sm font-medium text-raw-silver hover:bg-raw-black/50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-raw-gold/50 bg-raw-gold/15 px-4 py-2 text-sm font-medium text-raw-gold hover:bg-raw-gold/25 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
