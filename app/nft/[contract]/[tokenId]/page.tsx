"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ExternalLink, ChevronDown } from "lucide-react"
import { SendNFTModal } from "@/components/send-nft-modal"
import { useState, useEffect } from "react"
import { useFarcaster } from "@/app/providers"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useEthPrice } from "@/hooks/use-eth-price"

export default function NFTDetailPage({ params }: { params: { contract: string; tokenId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSendModal, setShowSendModal] = useState(false)
  const [isCollectionOpen, setIsCollectionOpen] = useState(false)
  const { sdk } = useFarcaster()
  const { ethPrice } = useEthPrice()

  const nftDataString = searchParams.get("data")
  const nft = nftDataString ? JSON.parse(decodeURIComponent(nftDataString)) : null

  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const floorPriceHistory = [
    { date: "Day 1", price: 0.1, usd: 0.1 * ethPrice },
    { date: "Day 2", price: 0.15, usd: 0.15 * ethPrice },
    { date: "Day 3", price: 0.29, usd: 0.29 * ethPrice },
    { date: "Day 4", price: 0.1, usd: 0.1 * ethPrice },
    { date: "Day 5", price: 0.14, usd: 0.14 * ethPrice },
    { date: "Day 6", price: 0.13, usd: 0.13 * ethPrice },
    { date: "Day 7", price: 0.3, usd: 0.3 * ethPrice },
    { date: "Day 8", price: 0.5, usd: 0.5 * ethPrice },
    { date: "Day 9", price: 0.45, usd: 0.45 * ethPrice },
  ]

  useEffect(() => {
    if (nft) {
      console.log("[v0] NFT full object:", nft)
      console.log("[v0] contract.openSeaMetadata:", nft?.contract?.openSeaMetadata)
      console.log("[v0] contract.openSeaMetadata.floorPrice:", nft?.contract?.openSeaMetadata?.floorPrice)
      console.log("[v0] collectionFloorPrice:", nft?.collectionFloorPrice)
      console.log("[v0] Collection details:", {
        name: nft.collection,
        description: nft?.contract?.openSeaMetadata?.description,
        totalSupply: nft?.contract?.totalSupply,
      })
    }
  }, [nft])

  useEffect(() => {
    if (!nft?.contractAddress) {
      console.log("[v0] No contract address, skipping price history fetch")
      return
    }

    const fetchPriceHistory = async () => {
      setLoadingHistory(true)
      console.log("[v0] Starting price history fetch for contract:", nft.contractAddress)

      try {
        const url = `/api/price-history?contractAddress=${nft.contractAddress}`
        console.log("[v0] Fetching from URL:", url)

        const response = await fetch(url)
        console.log("[v0] Response status:", response.status)

        const data = await response.json()
        console.log("[v0] Response data:", data)

        if (data?.events && Array.isArray(data.events) && data.events.length > 0) {
          console.log("[v0] Setting price history with", data.events.length, "data points")
          console.log("[v0] First few data points:", data.events.slice(0, 3))
          setPriceHistory(data.events)
        } else {
          console.log("[v0] No price history events returned or empty array")
        }
      } catch (error) {
        console.error("[v0] Error fetching price history:", error)
      } finally {
        setLoadingHistory(false)
        console.log("[v0] Price history fetch completed")
      }
    }

    fetchPriceHistory()
  }, [nft?.contractAddress])

  const formattedFloor = nft?.floorPrice && nft.floorPrice !== "—" ? nft.floorPrice : null

  const collectionDescription = nft?.description || null
  const collectionSupply = nft?.supply || null

  const handleHide = () => {
    if (!nft) return

    if (nft.isHiddenPage) {
      const hiddenNFTs = JSON.parse(localStorage.getItem("hidden_nfts") || "[]")
      const updated = hiddenNFTs.filter((id: string) => id !== nft.id)
      localStorage.setItem("hidden_nfts", JSON.stringify(updated))
    } else {
      const hiddenNFTs = JSON.parse(localStorage.getItem("hidden_nfts") || "[]")
      if (!hiddenNFTs.includes(nft.id)) {
        hiddenNFTs.push(nft.id)
        localStorage.setItem("hidden_nfts", JSON.stringify(hiddenNFTs))
      }
    }

    router.back()
  }

  if (!nft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">NFT not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="aspect-square relative bg-muted rounded-lg overflow-hidden mb-6">
          <Image src={nft.image || "/placeholder.svg"} alt={nft.name} fill className="object-cover" />
        </div>

        <Card className="p-4 mb-4 bg-card border-border">
          <div className="space-y-3">
            <Collapsible open={isCollectionOpen} onOpenChange={setIsCollectionOpen}>
              <CollapsibleTrigger className="flex justify-between items-center w-full hover:bg-muted/50 rounded px-2 py-1 -mx-2">
                <span className="text-sm text-muted-foreground">Collection</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{nft.collection}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isCollectionOpen ? "rotate-180" : ""}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3 pt-3 border-t border-border">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Collection Floor</span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formattedFloor ? `${formattedFloor} ETH` : "—"}
                    </div>
                    {formattedFloor && (
                      <div className="text-xs text-muted-foreground">
                        ${(Number(formattedFloor) * ethPrice).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground mb-2">Floor Price History</p>
                  <div className="h-40 bg-muted rounded p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={floorPriceHistory}>
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[0, 1]} hide />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                          }}
                          formatter={(value: number) => {
                            if (typeof value !== "number" || !Number.isFinite(value)) return ["—", "Price"]
                            return [`${value.toFixed(4)} ETH ($${(value * ethPrice).toFixed(2)})`, "Price"]
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground mb-2">Price History</p>
                  {loadingHistory ? (
                    <div className="h-32 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Loading...</span>
                    </div>
                  ) : priceHistory.length > 0 ? (
                    <div className="h-32 bg-muted rounded p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={priceHistory}>
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{
                              background: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                            }}
                            formatter={(value: number) => {
                              if (typeof value !== "number" || !Number.isFinite(value)) return ["—", "Price"]
                              return [`${value.toFixed(4)} ETH`, "Price"]
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-32 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No sales history available</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground mb-1">About</p>
                  <p className="text-xs text-foreground">
                    {collectionDescription || "No description available"}
                    {nft.rawMetadata?.creator && (
                      <>
                        {" "}
                        <a
                          href={`https://basescan.org/address/${nft.rawMetadata.creator}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {nft.rawMetadata.creator.slice(0, 6)}...{nft.rawMetadata.creator.slice(-4)}
                        </a>
                      </>
                    )}
                  </p>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground mb-2">Traits</p>
                  {nft.traits && nft.traits.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {nft.traits.map((trait: any, index: number) => {
                        const percentage =
                          trait.trait_count && collectionSupply
                            ? ((trait.trait_count / Number(collectionSupply)) * 100).toFixed(1) + "%"
                            : null

                        return (
                          <div key={index} className="bg-muted rounded p-2">
                            <p className="text-[10px] text-muted-foreground uppercase mb-0.5">{trait.trait_type}</p>
                            <p className="text-xs font-medium text-foreground truncate">{trait.value}</p>
                            {percentage && <p className="text-[10px] text-muted-foreground mt-0.5">{percentage}</p>}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-foreground">No traits available</p>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground mb-1">Rarity</p>
                  <p className="text-xs text-foreground">None</p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-between items-start border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Token ID</span>
              <span className="text-sm font-medium text-foreground">{nft.tokenId}</span>
            </div>
            <div className="flex justify-between items-start border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Chain</span>
              <span className="text-sm font-medium text-foreground">Base</span>
            </div>
            <div className="flex justify-between items-start border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Explorer</span>
              <a
                href={`https://basescan.org/nft/${nft.contractAddress}/${nft.tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                View on Basescan
              </a>
            </div>
          </div>
        </Card>

        <Card className="p-3 mb-6 bg-card border-border">
          <h3 className="text-sm font-medium text-foreground mb-2">View on marketplaces</h3>
          <div className="space-y-1">
            <button
              onClick={() =>
                sdk?.actions.openUrl(`https://opensea.io/assets/base/${nft.contractAddress}/${nft.tokenId}`)
              }
              className="w-full flex items-center justify-between p-2 rounded hover:bg-muted transition-colors text-left"
            >
              <span className="text-sm text-foreground hover:underline">OpenSea</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </Card>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full bg-background text-foreground" onClick={handleHide}>
              {nft.isHiddenPage ? "Unhide" : "Hide NFT"}
            </Button>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setShowSendModal(true)}
            >
              Send
            </Button>
          </div>
        </div>
      </div>

      <SendNFTModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} nftIds={[nft.id]} nftData={[nft]} />
    </div>
  )
}
