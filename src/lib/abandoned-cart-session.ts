import { getAnalyticsSessionId, resetAnalyticsSessionId } from "@/lib/analytics";

export function getAbandonedCartSessionId() {
  return getAnalyticsSessionId();
}

export function resetAbandonedCartSessionId() {
  resetAnalyticsSessionId();
}
