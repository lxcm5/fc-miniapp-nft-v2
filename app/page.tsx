"use client"

import { WalletBalance } from "@/components/wallet-balance"
import { NFTGrid } from "@/components/nft-grid"
import { SendNFTModal } from "@/components/send-nft-modal"
import { useFarcaster } from "@/app/providers"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Page() {
  const { isSDKLoaded } = useFarcaster()
  const [gridMode, setGridMode] = useState<2 | 3 | 4 | "list">(3)
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const router = useRouter()

  const cycleGridMode = () => {
    if (gridMode === 2) setGridMode(3)
    else if (gridMode === 3) setGridMode(4)
    else if (gridMode === 4) setGridMode("list")
    else setGridMode(2)
  }

  const handleSendSelected = () => {
    setIsSendModalOpen(true)
  }

  const handleHideSelected = () => {
    const hiddenNFTs = JSON.parse(localStorage.getItem("hidden_nfts") || "[]")
    const updatedHidden = [...new Set([...hiddenNFTs, ...selectedNFTs])]
    localStorage.setItem("hidden_nfts", JSON.stringify(updatedHidden))
    setSelectedNFTs([])
    setIsSelectionMode(false)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <header className="mb-5.5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[1.35rem] font-bold text-foreground">NFT aWallet</h1>
            <Button variant="outline" size="sm" onClick={() => router.push("/hidden")} className="bg-transparent">
              Hidden NFTs
            </Button>
          </div>
        </header>

        {!isSDKLoaded ? (
          <div className="mb-4 text-sm text-muted-foreground">Loading Farcaster SDK...</div>
        ) : (
          <>
            <div className="mb-5.5">
              <WalletBalance />
            </div>

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
              <NFTGrid
                gridMode={gridMode}
                selectedNFTs={selectedNFTs}
                setSelectedNFTs={setSelectedNFTs}
                isSelectionMode={isSelectionMode}
                setIsSelectionMode={setIsSelectionMode}
                isHiddenPage={false}
              />
            </div>
          </>
        )}
      </div>

      {isSelectionMode && selectedNFTs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="max-w-6xl mx-auto grid grid-cols-2 gap-3">
            <Button onClick={handleSendSelected} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Send ({selectedNFTs.length})
            </Button>
            <Button onClick={handleHideSelected} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Hide ({selectedNFTs.length})
            </Button>
          </div>
        </div>
      )}

      <SendNFTModal
        isOpen={isSendModalOpen}
        onClose={() => {
          setIsSendModalOpen(false)
          setSelectedNFTs([])
          setIsSelectionMode(false)
        }}
        nftIds={selectedNFTs}
      />
    </div>
  )
}
