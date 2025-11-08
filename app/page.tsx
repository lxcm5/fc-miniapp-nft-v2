"use client"

import { WalletBalance } from "@/components/wallet-balance"
import { NFTGrid } from "@/components/nft-grid"
import { useFarcaster } from "@/app/providers"

export default function Page() {
  const { isSDKLoaded } = useFarcaster()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Farcaster Wallet</h1>
          </div>
        </header>

        {!isSDKLoaded && <div className="mb-4 text-sm text-muted-foreground">Loading Farcaster SDK...</div>}

        {/* Wallet Balance */}
        <div className="mb-8">
          <WalletBalance />
        </div>

        {/* NFT Collection */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">My NFT Collection</h2>
          <NFTGrid />
        </div>
      </div>
    </div>
  )
}
