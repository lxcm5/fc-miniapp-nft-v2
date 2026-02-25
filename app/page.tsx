"use client"

import { WalletBalance } from "@/components/wallet-balance"
import { NFTGrid } from "@/components/nft-grid"
import { SendNFTModal } from "@/components/send-nft-modal"
import { useFarcaster } from "@/app/providers"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowUpNarrowWide, ArrowDownWideNarrow, House } from "lucide-react"
import { Menu } from "@/components/menu-dropdown"
import { useEthPrice } from "@/hooks/use-eth-price"

// Minimum downward drag distance (px) to trigger refresh
const PULL_THRESHOLD = 60

export default function Page() {
  const { isSDKLoaded, walletAddress, ethBalance } = useFarcaster()
  const { ethPrice } = useEthPrice()
  const [gridMode, setGridMode] = useState<2 | 3 | 4 | "list">(3)
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "name" | "collection" | "floor">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  const [nftCount, setNftCount] = useState<number>(0)
  const [nftTotalValue, setNftTotalValue] = useState<number>(0)

  // View another wallet state
  const [viewingAddress, setViewingAddress] = useState<string | null>(null)
  const [viewingUsername, setViewingUsername] = useState<string | null>(null)

  // Pull-to-refresh state
  const [pullDelta, setPullDelta] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Refs for non-reactive pull tracking (avoids stale closure in non-passive listener)
  const pullStartYRef = useRef<number | null>(null)
  const pullDeltaRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const router = useRouter()

  const fetchNFTStats = useCallback(async () => {
    const targetAddress = viewingAddress || walletAddress
    if (!targetAddress) return

    try {
      const response = await fetch(`/api/nfts?address=${targetAddress}`)
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
  }, [walletAddress, viewingAddress])

  useEffect(() => {
    fetchNFTStats()
  }, [fetchNFTStats])

  // Attach a non-passive touchmove listener to the container so we can call
  // preventDefault() and stop the native scroll/overscroll while the user is
  // performing a pull-to-refresh gesture.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onTouchMove = (e: TouchEvent) => {
      if (pullStartYRef.current === null) return
      const delta = e.touches[0].clientY - pullStartYRef.current
      // Only suppress scroll when dragging downward from the top of the page
      if (delta > 0 && window.scrollY === 0) {
        e.preventDefault()
      }
    }

    container.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => container.removeEventListener("touchmove", onTouchMove)
  }, [])

  // Touch start — record the initial finger position when the page is at the top
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (window.scrollY === 0) {
      pullStartYRef.current = e.touches[0].clientY
      pullDeltaRef.current = 0
      setPullDelta(0)
    }
  }

  // Touch move — update pull distance while dragging downward
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (pullStartYRef.current === null) return

    // Cancel pull tracking if the page has scrolled (e.g. another scroll axis)
    if (window.scrollY > 0) {
      pullStartYRef.current = null
      pullDeltaRef.current = 0
      setPullDelta(0)
      return
    }

    const delta = e.touches[0].clientY - pullStartYRef.current
    if (delta > 0) {
      // Cap visual travel so the indicator doesn't fly off-screen
      const capped = Math.min(delta, PULL_THRESHOLD * 1.5)
      pullDeltaRef.current = capped
      setPullDelta(capped)
    } else {
      pullDeltaRef.current = 0
      setPullDelta(0)
    }
  }

  // Touch end — trigger refresh if the drag exceeded the threshold
  const handleTouchEnd = async () => {
    if (pullStartYRef.current === null) return
    pullStartYRef.current = null

    const currentDelta = pullDeltaRef.current
    pullDeltaRef.current = 0

    if (currentDelta >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      setPullDelta(0)
      // Increment refreshKey so NFTGrid re-fetches its list
      setRefreshKey((prev) => prev + 1)
      await fetchNFTStats()
      setIsRefreshing(false)
    } else {
      setPullDelta(0)
    }
  }

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

  const nftUsdValue = (nftTotalValue * ethPrice).toFixed(2)

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
    }
  }

  const toggleHeaderCollapse = () => {
    setIsHeaderCollapsed((prev) => !prev)
  }

  // Compute vertical offset for the pull indicator (as a percentage of its own height).
  // -100% = fully hidden above the viewport top
  //    0% = fully visible at the top of the viewport
  const indicatorTranslateY = isRefreshing
    ? 0
    : pullDelta > 0
      ? -100 + Math.min((pullDelta / PULL_THRESHOLD) * 100, 100)
      : -100

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background pb-20"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator — fixed at the top, slides in from above */}
      <div
        className="fixed top-0 left-0 right-0 z-[60] flex justify-center pointer-events-none"
        style={{
          transform: `translateY(${indicatorTranslateY}%)`,
          // Animate back up after release; follow finger without transition while pulling
          transition: isRefreshing || pullDelta > 0 ? "none" : "transform 0.3s ease",
        }}
      >
        <div className="mt-2 flex items-center gap-1.5 bg-background border border-border rounded-full px-3 py-1.5 shadow-md text-xs font-medium text-foreground">
          {isRefreshing ? (
            <>
              <svg className="w-3 h-3 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Refreshing...
            </>
          ) : pullDelta >= PULL_THRESHOLD ? (
            <>
              <svg
                className="w-3 h-3 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Release to refresh
            </>
          ) : (
            <>
              <svg
                className="w-3 h-3 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              Pull to refresh
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="sticky top-0 bg-background z-50 pb-4 -mx-4 px-4">
          <header className={`${isHeaderCollapsed ? "mb-1" : "mb-2"}`}>
            <div className="flex items-center justify-between mb-1">
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
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push("/hidden")} className="bg-transparent">
                  Hidden NFTs
                </Button>
                <Menu
                  onViewWallet={(address, username) => {
                    setViewingAddress(address)
                    setViewingUsername(username || null)
                  }}
                />
              </div>
            </div>

            {isHeaderCollapsed && (
              <div className="mb-1">
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
                <div className="mb-3">
                  <WalletBalance address={viewingAddress || undefined} />
                </div>
              )}

              <div className="flex items-center justify-between mb-1">
                {!isHeaderCollapsed && (
                  <h2 className="text-sm font-semibold text-foreground">
                    {viewingAddress
                      ? `${viewingUsername ? viewingUsername : viewingAddress.slice(0, 6) + "..." + viewingAddress.slice(-4)} Collection`
                      : "My Collection"}
                  </h2>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {viewingAddress && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewingAddress(null)
                        setViewingUsername(null)
                      }}
                      className="flex items-center gap-1 bg-transparent px-2"
                      title="Back to my wallet"
                    >
                      <House className="w-4 h-4" />
                    </Button>
                  )}
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
            refreshKey={refreshKey}
            address={viewingAddress || undefined}
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
