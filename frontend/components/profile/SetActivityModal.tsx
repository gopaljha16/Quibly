"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActivity } from "@/hooks/useActivity";
import { X } from "lucide-react";

interface SetActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const activityTypes = [
  { value: "CUSTOM", label: "Custom", icon: "✨", prefix: "" },
  { value: "LISTENING", label: "Listening", icon: "🎵", prefix: "Listening to" },
  { value: "WATCHING", label: "Watching", icon: "📺", prefix: "Watching" },
  { value: "COMPETING", label: "Competing", icon: "🏆", prefix: "Competing in" },
  { value: "STREAMING", label: "Streaming", icon: "📡", prefix: "Streaming" }
];

export function SetActivityModal({ isOpen, onClose }: SetActivityModalProps) {
  const { updateActivity, clearActivity, isLoading } = useActivity();
  const [type, setType] = useState<string>("CUSTOM");
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState("");
  const [emoji, setEmoji] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await updateActivity({
        type: type as any,
        name: name.trim(),
        details: details.trim() || undefined,
        state: state.trim() || undefined,
        emoji: emoji || undefined
      });
      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to set activity:", error);
    }
  };

  const handleClear = async () => {
    try {
      await clearActivity();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to clear activity:", error);
    }
  };

  const resetForm = () => {
    setType("CUSTOM");
    setName("");
    setDetails("");
    setState("");
    setEmoji("");
  };

  const selectedType = activityTypes.find(t => t.value === type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-[#313338] border-none p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <DialogTitle className="text-xl font-semibold text-white">
            Set a custom activity
          </DialogTitle>
          <button
            onClick={onClose}
            className="text-[#b5bac1] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-4">
          {/* Activity Type Selection */}
          <div>
            <Label className="text-xs font-bold text-[#b5bac1] uppercase mb-2 block">
              Activity Type
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {activityTypes.map((actType) => (
                <button
                  key={actType.value}
                  type="button"
                  onClick={() => setType(actType.value)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                    type === actType.value
                      ? "bg-[#5865f2] text-white"
                      : "bg-[#1e1f22] text-[#b5bac1] hover:bg-[#2b2d31]"
                  }`}
                  title={actType.label}
                >
                  <span className="text-2xl">{actType.icon}</span>
                  <span className="text-[10px] font-medium">{actType.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Name */}
          <div>
            <Label htmlFor="name" className="text-xs font-bold text-[#b5bac1] uppercase mb-2 block">
              {selectedType?.prefix || "Activity"} <span className="text-[#f23f43]">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spotify, YouTube, Valorant"
              maxLength={128}
              required
              className="bg-[#1e1f22] border-none text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
            />
          </div>

          {/* Details */}
          <div>
            <Label htmlFor="details" className="text-xs font-bold text-[#b5bac1] uppercase mb-2 block">
              Details
            </Label>
            <Input
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g., Song name, Video title"
              maxLength={128}
              className="bg-[#1e1f22] border-none text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
            />
          </div>

          {/* State */}
          <div>
            <Label htmlFor="state" className="text-xs font-bold text-[#b5bac1] uppercase mb-2 block">
              State
            </Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g., by Artist, Episode 5"
              maxLength={128}
              className="bg-[#1e1f22] border-none text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
            />
          </div>

          {/* Emoji */}
          <div>
            <Label htmlFor="emoji" className="text-xs font-bold text-[#b5bac1] uppercase mb-2 block">
              Emoji
            </Label>
            <Input
              id="emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="😊"
              maxLength={2}
              className="bg-[#1e1f22] border-none text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
            />
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
              Clear Activity
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !name.trim()}
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
