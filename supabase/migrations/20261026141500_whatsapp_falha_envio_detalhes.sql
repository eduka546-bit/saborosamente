-- Preserve Meta's actual reason when an accepted WhatsApp send later fails.
-- No messages, BOT modes, or existing receipt statuses are modified.
ALTER TABLE public.whatsapp_recibos
 ADD COLUMN IF NOT EXISTS error_code integer,
 ADD COLUMN IF NOT EXISTS error_message text;

COMMENT ON COLUMN public.whatsapp_recibos.error_code IS
 'Meta WhatsApp failure code, e.g. 131047 when 24h window is closed.';
COMMENT ON COLUMN public.whatsapp_recibos.error_message IS
 'Sanitized Meta failure explanation, limited to 300 characters in webhook.';

-- Clear error metadata when a later receipt confirms successful delivery/read.
-- Existing admin-only SELECT RLS policy remains in force.
