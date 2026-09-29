import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/storage-cleanup")({
  component: LegacyStorageCleanupRedirect,
});

function LegacyStorageCleanupRedirect() {
  if (typeof window !== "undefined") {
    window.location.replace("/admin/config");
  }
  return null;
}
