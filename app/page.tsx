"use client"

import { WalletBalance } from "@/components/wallet-balance"
import { NFTGrid } from "@/components/nft-grid"
import { useFarcaster } from "@/app/providers"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function Page() {
  const { isSDKLoaded } = useFarcaster()
  const [gridMode, setGridMode] = useState<2 | 3 | 4 | "list">(3)

  const cycleGridMode = () => {
    if (gridMode === 2) setGridMode(3)
    else if (gridMode === 3) setGridMode(4)
    else if (gridMode === 4) setGridMode("list")
    else setGridMode(2)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Header */}
        <header className="mb-5.5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-[1.35rem] font-bold text-foreground">NFT aWallet</h1>
          </div>
        </header>

        {!isSDKLoaded ? (
          <div className="mb-4 text-sm text-muted-foreground">Loading Farcaster SDK...</div>
        ) : (
          <>
            {/* Wallet Balance */}
            <div className="mb-5.5">
              <WalletBalance />
            </div>

            {/* NFT Collection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-foreground">My NFT Collection</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cycleGridMode}
                  className="flex items-center gap-2 bg-transparent"
                >
                  {gridMode === "list" ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                      List
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                      {gridMode}×
                    </>
                  )}
                </Button>
              </div>
              <NFTGrid gridMode={gridMode} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
