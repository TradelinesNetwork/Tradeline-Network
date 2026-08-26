CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subtotal numeric(12,2) NOT NULL,
  fees numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL,
  crypto text NOT NULL,
  network text NOT NULL,
  tx_hash text NOT NULL,
  merchant_address text NOT NULL,
  status text NOT NULL DEFAULT 'pending_verification',
  status_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tradeline_id text NOT NULL,
  tradeline_snapshot jsonb NOT NULL,
  au_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own order items metadata"
  ON public.order_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX orders_user_id_created_at_idx ON public.orders(user_id, created_at DESC);
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);

DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

CREATE TABLE IF NOT EXISTS public.broker_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name text NOT NULL, contact_name text NOT NULL,
  email text NOT NULL, phone text,
  tier text NOT NULL CHECK (tier IN ('starter','pro','elite')),
  monthly_volume text, notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  status_reason text, created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz
);
GRANT SELECT, INSERT ON public.broker_applications TO anon, authenticated;
GRANT ALL ON public.broker_applications TO service_role;
ALTER TABLE public.broker_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can apply as broker" ON public.broker_applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "applicants read own broker app" ON public.broker_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL, email text NOT NULL, phone text,
  bank_name text NOT NULL, card_limit numeric, card_age_years numeric,
  utilization_pct numeric, notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  status_reason text, created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz
);
GRANT SELECT, INSERT ON public.seller_applications TO anon, authenticated;
GRANT ALL ON public.seller_applications TO service_role;
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can apply as seller" ON public.seller_applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "applicants read own seller app" ON public.seller_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "admins manage all orders" ON public.orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "admins manage broker apps" ON public.broker_applications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "admins manage seller apps" ON public.seller_applications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));