CREATE UNIQUE INDEX IF NOT EXISTS orders_tx_hash_unique
  ON public.orders (lower(tx_hash))
  WHERE crypto <> 'CARD';