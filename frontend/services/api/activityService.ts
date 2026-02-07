import { apiGet, apiPost, apiDelete } from "@/lib/api";

export interface Activity {
  type: "CUSTOM" | "LISTENING" | "WATCHING" | "COMPETING" | "STREAMING";
  name: string;
  details?: string;
  state?: string;
  emoji?: string;
  startedAt: string;
  endsAt?: string;
}

export interface CustomStatus {
  customStatus: string;
  customStatusEmoji?: string;
  customStatusExpiresAt?: string;
}

export const activityService = {
  // Set user activity
  setActivity: async (activity: Partial<Activity>) => {
    const response = await apiPost("/activity", activity);
    return response;
  },

  // Clear user activity
  clearActivity: async () => {
    const response = await apiDelete("/activity");
    return response;
  },

  // Get user activity
  getActivity: async (userId: string) => {
    const response = await apiGet<{ activity: Activity | null }>(`/activity/${userId}`);
    return response;
  },

  // Get activity history
  getActivityHistory: async (limit = 20, offset = 0) => {
    const response = await apiGet(`/activity/history?limit=${limit}&offset=${offset}`);
    return response;
  },

  // Set custom status
  setCustomStatus: async (status: Partial<CustomStatus>) => {
    const response = await apiPost("/activity/status", status);
    return response;
  },

  // Clear custom status
  clearCustomStatus: async () => {
    const response = await apiDelete("/activity/status");
    return response;
  }
};
