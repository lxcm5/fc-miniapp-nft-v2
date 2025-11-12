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
  // TODO: put your test wallet address here (checks Alchemy pipeline end-to-end)
  const WALLET_ADDRESS = '0xYourWalletAddressHere'; // e.g. 0xabc...123

  const [nfts, setNfts] = useState<NftItem[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Build Alchemy base URL from env (you must set these on Vercel)
  const alchemyBase = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_ALCHEMY_BASE; // e.g. https://base.g.alchemy.com/nft/v3  OR  https://base-sepolia.g.alchemy.com/nft/v3
    const key = process.env.NEXT_PUBLIC_ALCHEMY_KEY;   // your Alchemy API key
    return base && key ? `${base}/${key}` : '';
  }, []);

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
        if (!alchemyBase) throw new Error('Missing Alchemy env (BASE / KEY)');

        const url = `${alchemyBase}/getNFTsForOwner?owner=${WALLET_ADDRESS}&withMetadata=true&pageSize=50`;
        console.log('[DEBUG] Fetch:', url);

        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`Alchemy HTTP ${res.status}. Body: ${txt.slice(0, 300)}`);
        }
        const data = await res.json();
        console.log('[DEBUG] Response:', data);

        const items: NftItem[] = data?.ownedNfts || data?.nfts || data?.assets || [];
        setNfts(items);
      } catch (e: any) {
        console.error('[DEBUG] Error:', e);
        setError(e?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, [alchemyBase, WALLET_ADDRESS]);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 16 }}>
      <h2 style={{ margin: '0 0 8px' }}>Debug: Alchemy NFT fetch</h2>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 12 }}>
        Wallet: {WALLET_ADDRESS.slice(0, 6)}…{WALLET_ADDRESS.slice(-4)}
      </div>

      {loading && <div>Loading…</div>}
      {!loading && error && <div style={{ color: '#b00' }}>Error: {error}</div>}
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
