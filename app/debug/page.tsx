'use client';

import React, { useEffect, useMemo, useState } from 'react';

type NftItem = {
  contract?: { address?: string; name?: string };
  tokenId?: string;
  name?: string;
  image?: { originalUrl?: string; pngUrl?: string; thumbnailUrl?: string };
  media?: Array<{ gateway?: string; raw?: string }>;
};

export default function DebugPage() {
  // Put an address that HAS NFTs on the chosen network
  const WALLET_ADDRESS = '0xdBB9f76DC289B4cec58BCfe10923084F96Fa6Aee';

  const [nfts, setNfts] = useState<NftItem[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Read env (must be set on Vercel WITHOUT quotes)
  const envBase = process.env.NEXT_PUBLIC_ALCHEMY_BASE || '';
  const envKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY || '';

  // Build clean base (strip accidental quotes/spaces)
  const alchemyBase = useMemo(() => {
    if (!envBase || !envKey) return '';
    const base = envBase.trim().replace(/^["']|["']$/g, '');
    const key = envKey.trim().replace(/^["']|["']$/g, '');
    return `${base}/${key}`;
  }, [envBase, envKey]);

  // Compose test URL
  const testUrl = useMemo(() => {
    if (!alchemyBase) return '';
    const u = new URL(alchemyBase + '/getNFTsForOwner');
    u.searchParams.set('owner', WALLET_ADDRESS);
    u.searchParams.set('withMetadata', 'true');
    u.searchParams.set('pageSize', '50');
    return u.toString();
  }, [alchemyBase, WALLET_ADDRESS]);

  const imageOf = (n: NftItem) =>
    n.image?.originalUrl ||
    n.image?.pngUrl ||
    n.image?.thumbnailUrl ||
    n.media?.[0]?.gateway ||
    n.media?.[0]?.raw ||
    '';

  useEffect(() => {
    (async () => {
      try {
        if (!envBase || !envKey) throw new Error('Missing env: NEXT_PUBLIC_ALCHEMY_BASE or NEXT_PUBLIC_ALCHEMY_KEY');
        if (!alchemyBase) throw new Error('Computed Alchemy base is empty (likely quotes in env values)');

        const res = await fetch(testUrl, { cache: 'no-store' });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`Alchemy HTTP ${res.status}\n${body.slice(0, 500)}`);
        }
        const data = await res.json();
        const items: NftItem[] = data?.ownedNfts || data?.nfts || data?.assets || [];
        setNfts(items);
      } catch (e: any) {
        setError(e?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, [alchemyBase, testUrl, envBase, envKey]);

  const maskedKey = envKey ? envKey.slice(0, 3) + '…' + envKey.slice(-3) : '(empty)';

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 16, maxWidth: 820, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 8px' }}>Debug: Alchemy NFT fetch</h2>

      <div style={{ fontSize: 13, color: '#444', marginBottom: 12 }}>
        <div>Wallet: <code>{WALLET_ADDRESS}</code></div>
        <div>ENV BASE: <code>{envBase || '(empty)'}</code></div>
        <div>ENV KEY: <code>{maskedKey}</code></div>
        <div style={{ marginTop: 8 }}>Computed URL:</div>
        <div style={{ wordBreak: 'break-all', background: '#f8f8f8', padding: 8, borderRadius: 8 }}>
          <code>{testUrl || '(empty)'}</code>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          {testUrl ? (
            <>
              <a href={testUrl} target="_blank" rel="noreferrer" style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 }}>
                Open URL
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(testUrl)}
                style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, background: '#fff' }}
              >
                Copy URL
              </button>
            </>
          ) : null}
        </div>
      </div>

      {loading && <div>Loading…</div>}
      {!loading && error && (
        <pre style={{ color: '#b00', whiteSpace: 'pre-wrap', background: '#fff7f7', padding: 8, borderRadius: 8 }}>
Error: {error}
        </pre>
      )}
      {!loading && !error && nfts.length === 0 && <div>No NFTs found for this address (on this network).</div>}

      {!loading && !error && nfts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {nfts.map((n, i) => (
            <div key={i} style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <div style={{ width: '100%', aspectRatio: '1/1', background: '#f4f4f4' }}>
                {imageOf(n) ? (
                  <img src={imageOf(n)} alt={n.name || 'NFT'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : null}
              </div>
              <div style={{ padding: 8 }}>
                <div style={{ fontSize: 12, color: '#666' }}>{n.contract?.name || n.contract?.address?.slice(0, 10) || 'NFT'}</div>
                <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{n.name || `#${n.tokenId}`}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
