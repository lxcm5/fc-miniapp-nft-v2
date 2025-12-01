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

export default function NFTDetailPage({ params }: { params: { contract: string; tokenId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSendModal, setShowSendModal] = useState(false)
  const [isCollectionOpen, setIsCollectionOpen] = useState(false)
  const [collectionFloor, setCollectionFloor] = useState<string | null>(null)
  const [topOffer, setTopOffer] = useState<string | null>(null)
  const [collectionDescription, setCollectionDescription] = useState<string | null>(null)
  const [collectionSupply, setCollectionSupply] = useState<number | null>(null)
  const { sdk } = useFarcaster()

  const nftDataString = searchParams.get("data")
  const nft = nftDataString ? JSON.parse(decodeURIComponent(nftDataString)) : null

  useEffect(() => {
    console.log("[v0] NFT Detail Page - NFT data:", nft)
    console.log("[v0] NFT Detail Page - Contract address:", nft?.contractAddress)
  }, [nft])

  useEffect(() => {
    const fetchOpenSeaData = async () => {
      if (!nft) {
        console.log("[v0] Skipping API call - NFT is null")
        return
      }

      if (!nft.contractAddress) {
        console.log("[v0] Skipping API call - No contract address")
        return
      }

      try {
        console.log("[v0] Starting API fetch for contract:", nft.contractAddress)
        const url = `/api/opensea-data?contract=${nft.contractAddress}`
        console.log("[v0] Fetching URL:", url)

        const response = await fetch(url)
        console.log("[v0] API response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Full API response data:", JSON.stringify(data, null, 2))

          if (data.collectionFloor) {
            const floorValue = Number.parseFloat(data.collectionFloor).toFixed(4)
            console.log("[v0] Setting floor price:", floorValue)
            setCollectionFloor(floorValue)
          } else {
            console.log("[v0] No floor price in response")
            setCollectionFloor(null)
          }

          if (data.topOffer) {
            const offerValue = Number.parseFloat(data.topOffer).toFixed(4)
            console.log("[v0] Setting top offer:", offerValue)
            setTopOffer(offerValue)
          } else {
            console.log("[v0] No top offer in response")
            setTopOffer(null)
          }

          if (data.description) {
            console.log("[v0] Setting collection description")
            setCollectionDescription(data.description)
          }

          if (data.supply) {
            console.log("[v0] Setting collection supply:", data.supply)
            setCollectionSupply(data.supply)
          }
        } else {
          const errorText = await response.text()
          console.error("[v0] API error response:", errorText)
        }
      } catch (error) {
        console.error("[v0] Error fetching collection data:", error)
      }
    }

    console.log("[v0] useEffect running - NFT:", nft?.name, "Contract:", nft?.contractAddress)
    fetchOpenSeaData()
  }, [nft])

  useEffect(() => {
    const fetchCollectionData = async () => {
      if (!nft?.contractAddress) {
        console.log("[v0] No contract address, skipping API call")
        return
      }

      try {
        console.log("[v0] Fetching collection data for:", nft.contractAddress)

        const response = await fetch(
          `https://api.reservoir.tools/collections/v7?contract=${nft.contractAddress}&includeTopBid=true`,
        )

        if (!response.ok) {
          console.error("[v0] Reservoir API error:", response.status)
          return
        }

        const data = await response.json()
        console.log("[v0] Reservoir API response:", data)

        if (data.collections && data.collections.length > 0) {
          const collection = data.collections[0]
          console.log("[v0] Collection data:", collection)

          // Floor price
          if (collection.floorAsk?.price?.amount?.native) {
            const floor = Number(collection.floorAsk.price.amount.native).toFixed(4)
            console.log("[v0] Setting floor:", floor)
            setCollectionFloor(floor)
          }

          // Top bid
          if (collection.topBid?.price?.amount?.native) {
            const topBid = Number(collection.topBid.price.amount.native).toFixed(4)
            console.log("[v0] Setting top bid:", topBid)
            setTopOffer(topBid)
          }

          // Description
          if (collection.description) {
            setCollectionDescription(collection.description)
          }

          // Token count (supply)
          if (collection.tokenCount) {
            setCollectionSupply(Number(collection.tokenCount))
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching collection data:", error)
      }
    }

    fetchCollectionData()
  }, [nft?.contractAddress])

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
                  <span className="text-sm font-medium text-foreground">
                    {collectionFloor ? `${collectionFloor} ETH` : "—"}
                  </span>
                </div>

                <div className="flex justify-between items-start border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">Top offer</span>
                  <span className="text-sm font-medium text-foreground">{topOffer ? `${topOffer} ETH` : "—"}</span>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground mb-2">Price History</p>
                  <div className="h-32 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Chart coming soon</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground mb-1">About</p>
                  <p className="text-xs text-foreground">
                    {collectionDescription || nft.description || "No description available"}
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
                      {nft.traits.map((trait: any, index: number) => (
                        <div key={index} className="bg-muted rounded p-2">
                          <p className="text-[10px] text-muted-foreground uppercase mb-0.5">{trait.trait_type}</p>
                          <p className="text-xs font-medium text-foreground truncate">{trait.value}</p>
                          {trait.trait_count && collectionSupply && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {((trait.trait_count / collectionSupply) * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                      ))}
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
