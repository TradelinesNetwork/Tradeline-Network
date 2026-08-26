// Chain-specific on-chain probes for crypto deposit verification.
// Server-only (filename-blocked from client bundles).

export type VerifyResult =
  | { ok: true }
  | { ok: false; retry: true; reason: string }
  | { ok: false; retry: false; reason: string };

// --- Chain-specific probes (public endpoints, no API key required) ---

async function verifyEvm(chain: "eth" | "bsc", txHash: string, merchant: string): Promise<VerifyResult> {
  // BlockScout-family public endpoints (no key, generous free tier).
  const base = chain === "eth"
    ? "https://eth.blockscout.com/api"
    : "https://bscscan.com/api"; // BscScan tolerates keyless GETs for a while
  try {
    const url = `${base}?module=proxy&action=eth_getTransactionByHash&txhash=${encodeURIComponent(txHash)}`;
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) return { ok: false, retry: true, reason: `explorer ${r.status}` };
    const data: any = await r.json();
    const tx = data?.result;
    if (!tx) return { ok: false, retry: true, reason: "tx not indexed yet" };
    const to = String(tx.to || "").toLowerCase();
    if (to !== merchant.toLowerCase()) {
      // Native transfer went elsewhere — could still be an ERC-20 transfer to
      // merchant (input data). Keep as pending so a human can inspect.
      return { ok: false, retry: false, reason: `tx recipient (${tx.to}) does not match merchant address` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, retry: true, reason: `evm probe error: ${e?.message ?? "unknown"}` };
  }
}

async function verifyBtcLike(chain: "btc" | "ltc", txHash: string, merchant: string): Promise<VerifyResult> {
  const base = chain === "btc"
    ? "https://blockchain.info/rawtx"
    : "https://litecoinspace.org/api/tx";
  try {
    const url = chain === "btc" ? `${base}/${txHash}` : `${base}/${txHash}`;
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (r.status === 404) return { ok: false, retry: true, reason: "tx not seen on-chain yet" };
    if (!r.ok) return { ok: false, retry: true, reason: `explorer ${r.status}` };
    const data: any = await r.json();
    const outs: any[] = chain === "btc" ? (data?.out ?? []) : (data?.vout ?? []);
    const matched = outs.some((o: any) => {
      const addr = chain === "btc" ? o?.addr : o?.scriptpubkey_address;
      return addr && String(addr) === merchant;
    });
    return matched
      ? { ok: true }
      : { ok: false, retry: false, reason: "no output pays merchant address" };
  } catch (e: any) {
    return { ok: false, retry: true, reason: `${chain} probe error: ${e?.message ?? "unknown"}` };
  }
}

async function verifyTron(txHash: string, merchant: string): Promise<VerifyResult> {
  try {
    const r = await fetch(`https://apilist.tronscanapi.com/api/transaction-info?hash=${encodeURIComponent(txHash)}`, {
      headers: { accept: "application/json" },
    });
    if (!r.ok) return { ok: false, retry: true, reason: `tronscan ${r.status}` };
    const data: any = await r.json();
    if (!data?.hash) return { ok: false, retry: true, reason: "tx not indexed yet" };
    const trc20 = data?.trc20TransferInfo?.[0];
    const to = trc20?.to_address || data?.toAddress;
    if (!to) return { ok: false, retry: true, reason: "recipient not yet decoded" };
    return String(to) === merchant
      ? { ok: true }
      : { ok: false, retry: false, reason: `TRC-20 recipient (${to}) does not match merchant` };
  } catch (e: any) {
    return { ok: false, retry: true, reason: `tron probe error: ${e?.message ?? "unknown"}` };
  }
}

async function verifySolana(txHash: string, merchant: string): Promise<VerifyResult> {
  try {
    const r = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "getTransaction",
        params: [txHash, { encoding: "json", maxSupportedTransactionVersion: 0 }],
      }),
    });
    if (!r.ok) return { ok: false, retry: true, reason: `solana rpc ${r.status}` };
    const data: any = await r.json();
    if (!data?.result) return { ok: false, retry: true, reason: "tx not confirmed yet" };
    const keys: string[] = data.result?.transaction?.message?.accountKeys ?? [];
    return keys.includes(merchant)
      ? { ok: true }
      : { ok: false, retry: false, reason: "merchant address not referenced in tx" };
  } catch (e: any) {
    return { ok: false, retry: true, reason: `solana probe error: ${e?.message ?? "unknown"}` };
  }
}

export async function verifyOne(crypto: string, network: string, txHash: string, merchant: string): Promise<VerifyResult> {
  if (crypto === "BTC" && network === "Bitcoin")  return verifyBtcLike("btc", txHash, merchant);
  if (crypto === "LTC" && network === "Litecoin") return verifyBtcLike("ltc", txHash, merchant);
  if (network === "ERC-20") return verifyEvm("eth", txHash, merchant);
  if (network === "BEP-20") return verifyEvm("bsc", txHash, merchant);
  if (network === "TRC-20") return verifyTron(txHash, merchant);
  if (network === "Solana") return verifySolana(txHash, merchant);
  // RENEC and other niche chains: leave for human review.
  return { ok: false, retry: false, reason: `no automated verifier for ${crypto}/${network}` };
}

