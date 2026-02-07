"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SetActivityModal } from "./SetActivityModal";
import { SetCustomStatusModal } from "./SetCustomStatusModal";
import { useActivity } from "@/hooks/useActivity";
import { ActivityDisplay } from "./ActivityDisplay";
import { Smile, Sparkles } from "lucide-react";

export function StatusMenu() {
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const { activity, customStatus } = useActivity();

  return (
    <div className="space-y-3">
      {/* Current Activity/Status Display */}
      {(activity || customStatus?.customStatus) && (
        <div className="bg-[#2b2d31] rounded-lg p-3">
          <ActivityDisplay
            activity={activity}
            customStatus={customStatus?.customStatus}
            customStatusEmoji={customStatus?.customStatusEmoji}
          />
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStatusModal(true)}
          className="flex-1 bg-[#2b2d31] border-none text-[#dbdee1] hover:bg-[#35373c] hover:text-white transition-colors"
        >
          <Smile className="w-4 h-4 mr-2" />
          {customStatus?.customStatus ? "Edit Status" : "Set Status"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowActivityModal(true)}
          className="flex-1 bg-[#2b2d31] border-none text-[#dbdee1] hover:bg-[#35373c] hover:text-white transition-colors"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {activity ? "Edit Activity" : "Set Activity"}
        </Button>
      </div>

      {/* Modals */}
      <SetActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
      />
      <SetCustomStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
      />
    </div>
  );
}
