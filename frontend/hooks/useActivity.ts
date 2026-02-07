import { useState, useEffect, useCallback } from "react";
import { useSocket } from "@/providers/SocketProvider";
import { activityService, Activity, CustomStatus } from "@/services/api/activityService";

export const useActivity = (userId?: string) => {
  const { socket } = useSocket();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [customStatus, setCustomStatus] = useState<CustomStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for activity changes via socket
  useEffect(() => {
    if (!socket) return;

    const handleActivityChange = (data: { userId: string; activity: Activity | null }) => {
      if (!userId || data.userId === userId) {
        setActivity(data.activity);
      }
    };

    const handleCustomStatusChange = (data: { userId: string } & Partial<CustomStatus>) => {
      if (!userId || data.userId === userId) {
        setCustomStatus({
          customStatus: data.customStatus || "",
          customStatusEmoji: data.customStatusEmoji,
          customStatusExpiresAt: data.customStatusExpiresAt
        });
      }
    };

    socket.on("user_activity_change", handleActivityChange);
    socket.on("user_custom_status_change", handleCustomStatusChange);

    return () => {
      socket.off("user_activity_change", handleActivityChange);
      socket.off("user_custom_status_change", handleCustomStatusChange);
    };
  }, [socket, userId]);

  // Fetch initial activity
  useEffect(() => {
    if (userId) {
      activityService.getActivity(userId)
        .then(data => setActivity(data.activity))
        .catch(err => console.error("Failed to fetch activity:", err));
    }
  }, [userId]);

  // Set activity
  const updateActivity = useCallback(async (activityData: Partial<Activity>) => {
    setIsLoading(true);
    setError(null);
    try {
      if (socket) {
        socket.emit("update_activity", activityData);
      } else {
        await activityService.setActivity(activityData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update activity");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [socket]);

  // Clear activity
  const clearActivity = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (socket) {
        socket.emit("clear_activity");
      } else {
        await activityService.clearActivity();
      }
    } catch (err: any) {
      setError(err.message || "Failed to clear activity");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [socket]);

  // Set custom status
  const updateCustomStatus = useCallback(async (statusData: Partial<CustomStatus>) => {
    setIsLoading(true);
    setError(null);
    try {
      if (socket) {
        socket.emit("update_custom_status", statusData);
      } else {
        await activityService.setCustomStatus(statusData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update custom status");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [socket]);

  // Clear custom status
  const clearCustomStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (socket) {
        socket.emit("clear_custom_status");
      } else {
        await activityService.clearCustomStatus();
      }
    } catch (err: any) {
      setError(err.message || "Failed to clear custom status");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [socket]);

  return {
    activity,
    customStatus,
    isLoading,
    error,
    updateActivity,
    clearActivity,
    updateCustomStatus,
    clearCustomStatus
  };
};
