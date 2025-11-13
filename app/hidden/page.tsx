"use client"
import { NFTGrid } from "@/components/nft-grid"
import { useFarcaster } from "@/app/providers"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function HiddenPage() {
  const { isSDKLoaded } = useFarcaster()
  const [gridMode, setGridMode] = useState<2 | 3 | 4 | "list">(3)
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [hiddenCount, setHiddenCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const hiddenNFTs = JSON.parse(localStorage.getItem("hidden_nfts") || "[]")
    setHiddenCount(hiddenNFTs.length)
  }, [])

  const cycleGridMode = () => {
    if (gridMode === 2) setGridMode(3)
    else if (gridMode === 3) setGridMode(4)
    else if (gridMode === 4) setGridMode("list")
    else setGridMode(2)
  }

  const handleSendSelected = () => {
    console.log("[v0] Send NFTs:", selectedNFTs)
    alert("Send functionality coming soon!")
  }

  const handleUnhideSelected = () => {
    const hiddenNFTs = JSON.parse(localStorage.getItem("hidden_nfts") || "[]")
    const updatedHidden = hiddenNFTs.filter((id: string) => !selectedNFTs.includes(id))
    localStorage.setItem("hidden_nfts", JSON.stringify(updatedHidden))
    setSelectedNFTs([])
    setIsSelectionMode(false)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <header className="mb-5.5">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[1.35rem] font-bold text-foreground">Hidden NFTs</h1>
              <p className="text-sm text-muted-foreground mt-1">{hiddenCount} hidden NFTs</p>
            </div>
          </div>
        </header>

        {!isSDKLoaded ? (
          <div className="mb-4 text-sm text-muted-foreground">Loading Farcaster SDK...</div>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-foreground">Hidden Collection</h2>
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
                isHiddenPage={true}
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
            <Button onClick={handleUnhideSelected} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Unhide ({selectedNFTs.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
