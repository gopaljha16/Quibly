"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActivity } from "@/hooks/useActivity";
import { X, Smile } from "lucide-react";

interface SetCustomStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const commonEmojis = ["😊", "😎", "🎮", "💻", "🎵", "📚", "☕", "🌙", "⚡", "🔥", "💤", "🎨"];

const expiryOptions = [
  { label: "Don't clear", value: null },
  { label: "30 minutes", value: 30 * 60 * 1000 },
  { label: "1 hour", value: 60 * 60 * 1000 },
  { label: "4 hours", value: 4 * 60 * 60 * 1000 },
  { label: "Today", value: "today" }
];

export function SetCustomStatusModal({ isOpen, onClose }: SetCustomStatusModalProps) {
  const { updateCustomStatus, clearCustomStatus, isLoading } = useActivity();
  const [status, setStatus] = useState("");
  const [emoji, setEmoji] = useState("");
  const [expiryOption, setExpiryOption] = useState<string | number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status.trim()) return;

    try {
      let expiresAt: string | undefined;
      
      if (expiryOption === "today") {
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        expiresAt = endOfDay.toISOString();
      } else if (typeof expiryOption === "number") {
        expiresAt = new Date(Date.now() + expiryOption).toISOString();
      }

      await updateCustomStatus({
        customStatus: status.trim(),
        customStatusEmoji: emoji || undefined,
        customStatusExpiresAt: expiresAt
      });
      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to set custom status:", error);
    }
  };

  const handleClear = async () => {
    try {
      await clearCustomStatus();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to clear custom status:", error);
    }
  };

  const resetForm = () => {
    setStatus("");
    setEmoji("");
    setExpiryOption(null);
    setShowEmojiPicker(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-[#313338] border-none p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <DialogTitle className="text-xl font-semibold text-white">
            Set a custom status
          </DialogTitle>
          <button
            onClick={onClose}
            className="text-[#b5bac1] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-4">
          {/* Status Input with Emoji */}
          <div>
            <Label htmlFor="status" className="text-xs font-bold text-[#b5bac1] uppercase mb-2 block">
              What's on your mind?
            </Label>
            <div className="relative">
              <Input
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Support has arrived!"
                maxLength={128}
                className="bg-[#1e1f22] border-none text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#b5bac1] hover:text-white transition-colors"
              >
                {emoji || <Smile className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Quick Emoji Picker */}
          {showEmojiPicker && (
            <div className="bg-[#1e1f22] rounded-lg p-3">
              <div className="grid grid-cols-6 gap-2">
                {commonEmojis.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setEmoji(e);
                      setShowEmojiPicker(false);
                    }}
                    className="text-2xl hover:bg-[#2b2d31] rounded p-2 transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear After */}
          <div>
            <Label className="text-xs font-bold text-[#b5bac1] uppercase mb-2 block">
              Clear After
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {expiryOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setExpiryOption(option.value)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                    expiryOption === option.value
                      ? "bg-[#5865f2] text-white"
                      : "bg-[#1e1f22] text-[#b5bac1] hover:bg-[#2b2d31]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none text-white hover:bg-[#4e5058] hover:text-white"
            >
              Clear Status
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !status.trim()}
              className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white border-none disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
