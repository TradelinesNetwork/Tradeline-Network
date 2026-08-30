ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz;