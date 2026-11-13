import { getAnalyticsSessionId } from "@/lib/analytics";

export function getAbandonedCartSessionId() {
  return getAnalyticsSessionId();
}
