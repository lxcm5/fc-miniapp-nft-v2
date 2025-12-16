"use client"

import { WalletBalance } from "@/components/wallet-balance"
import { NFTGrid } from "@/components/nft-grid"
import { SendNFTModal } from "@/components/send-nft-modal"
import { useFarcaster } from "@/app/providers"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowUpNarrowWide, ArrowDownWideNarrow } from "lucide-react"

export default function Page() {
  const { isSDKLoaded, walletAddress, ethBalance } = useFarcaster()
  const [gridMode, setGridMode] = useState<2 | 3 | 4 | "list">(3)
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "name" | "collection" | "floor">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  const [nftCount, setNftCount] = useState<number>(0)
  const [nftTotalValue, setNftTotalValue] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    const fetchNFTStats = async () => {
      if (!walletAddress) return

      try {
        const response = await fetch(`/api/nfts?address=${walletAddress}`)
        const data = await response.json()

        if (data.error) return

        const allNFTs = data.nfts || []
        const hiddenNFTs = JSON.parse(localStorage.getItem("hidden_nfts") || "[]")
        const visibleNFTs = allNFTs.filter((nft: any) => {
          const nftId = `${nft.contract.address}-${nft.tokenId.tokenId || nft.tokenId}`
          return !hiddenNFTs.includes(nftId)
        })

        const nftsWithFloor = visibleNFTs.filter((nft: any) => {
          const floorPrice = nft.contract.openSeaMetadata?.floorPrice
          return floorPrice && floorPrice > 0
        })

        const totalValue = nftsWithFloor.reduce((sum: number, nft: any) => {
          const floorPrice = nft.contract.openSeaMetadata?.floorPrice || 0
          return sum + Number(floorPrice)
        }, 0)

        setNftCount(visibleNFTs.length)
        setNftTotalValue(totalValue)
      } catch (error) {
        console.error("[v0] Error fetching NFT stats:", error)
      }
    }

    fetchNFTStats()
  }, [walletAddress])

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

  const cycleSortMode = () => {
    if (sortBy === "date") setSortBy("name")
    else if (sortBy === "name") setSortBy("collection")
    else if (sortBy === "collection") setSortBy("floor")
    else setSortBy("date")
  }

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  const ethToUsd = 2850
  const nftUsdValue = (nftTotalValue * ethToUsd).toFixed(2)

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
    }
  }

  const toggleHeaderCollapse = () => {
    setIsHeaderCollapsed((prev) => !prev)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="sticky top-0 bg-background z-50 pb-4 -mx-4 px-4">
          <header className={`${isHeaderCollapsed ? "mb-1" : "mb-4"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleHeaderCollapse} className="bg-transparent px-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={isHeaderCollapsed ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"}
                    />
                  </svg>
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push("/hidden")} className="bg-transparent">
                Hidden NFTs
              </Button>
            </div>

            {isHeaderCollapsed && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm py-2 px-3 bg-card rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{nftCount} NFTs</span>
                    <span className="text-muted-foreground">
                      {nftTotalValue.toFixed(3)} ETH (${nftUsdValue})
                    </span>
                  </div>
                  {walletAddress && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-mono"
                    >
                      {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </header>

          {!isSDKLoaded ? (
            <div className="mb-2 text-sm text-muted-foreground">Loading Farcaster SDK...</div>
          ) : (
            <>
              {!isHeaderCollapsed && (
                <div className="mb-4">
                  <WalletBalance />
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                {!isHeaderCollapsed && <h2 className="text-sm font-semibold text-foreground">My Collection</h2>}
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cycleSortMode}
                    className="flex items-center gap-2 bg-transparent capitalize"
                  >
                    {sortBy === "date" && "Date"}
                    {sortBy === "name" && "Name"}
                    {sortBy === "collection" && "Collection"}
                    {sortBy === "floor" && "Floor"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSortDirection}
                    className="flex items-center gap-1 bg-transparent px-2"
                  >
                    {sortDirection === "asc" ? (
                      <ArrowUpNarrowWide className="w-4 h-4" />
                    ) : (
                      <ArrowDownWideNarrow className="w-4 h-4" />
                    )}
                  </Button>
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
              </div>
            </>
          )}
        </div>

        {isSDKLoaded && (
          <NFTGrid
            gridMode={gridMode}
            selectedNFTs={selectedNFTs}
            setSelectedNFTs={setSelectedNFTs}
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
            isHiddenPage={false}
            sortBy={sortBy}
            sortDirection={sortDirection}
          />
        )}
      </div>

      {isSelectionMode && selectedNFTs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
          <div className="max-w-6xl mx-auto grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedNFTs([])
                setIsSelectionMode(false)
              }}
              className="bg-background text-foreground"
            >
              Cancel
            </Button>
            <Button variant="outline" onClick={handleHideSelected} className="bg-background text-foreground">
              Hide ({selectedNFTs.length})
            </Button>
            <Button onClick={handleSendSelected} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Send ({selectedNFTs.length})
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
