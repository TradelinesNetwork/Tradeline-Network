GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;

DROP POLICY IF EXISTS "users insert own orders" ON public.orders;
CREATE POLICY "users insert own orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users insert own order items" ON public.order_items;
CREATE POLICY "users insert own order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);