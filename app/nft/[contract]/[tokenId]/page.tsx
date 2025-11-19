"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { SendNFTModal } from "@/components/send-nft-modal"
import { useState } from "react"
import { useFarcaster } from "@/app/providers"

export default function NFTDetailPage({ params }: { params: { contract: string; tokenId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSendModal, setShowSendModal] = useState(false)
  const { sdk } = useFarcaster()

  const nftDataString = searchParams.get("data")
  const nft = nftDataString ? JSON.parse(decodeURIComponent(nftDataString)) : null

  const handleSetAvatar = async () => {
    if (!nft || !sdk) {
      console.log("[v0] Cannot set avatar - missing nft or sdk")
      return
    }
    
    console.log("[v0] Setting avatar for NFT:", nft.contractAddress, nft.tokenId)
    
    // Format: eip155:8453/erc721:0x.../tokenId
    const tokenCAIP = `eip155:8453/erc721:${nft.contractAddress.toLowerCase()}/${nft.tokenId}`
    console.log("[v0] Token CAIP-19:", tokenCAIP)
    
    try {
      if (sdk.actions && sdk.actions.viewToken) {
        console.log("[v0] Calling sdk.actions.viewToken")
        await sdk.actions.viewToken({ token: tokenCAIP })
      } else {
        console.error("[v0] sdk.actions.viewToken not available")
        alert("Set as avatar is only available in Warpcast")
      }
    } catch (error) {
      console.error("[v0] Error setting avatar:", error)
      alert("Failed to open NFT viewer")
    }
  }

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
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Collection</span>
              <span className="text-sm font-medium text-foreground truncate ml-4">{nft.collection}</span>
            </div>
            <div className="flex justify-between items-start border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Token ID</span>
              <span className="text-sm font-medium text-foreground">{nft.tokenId}</span>
            </div>
            <div className="flex justify-between items-start border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Floor price</span>
              <span className="text-sm font-medium text-foreground">{nft.floorPrice || "—"} ETH</span>
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
              onClick={() => sdk?.actions.openUrl(`https://opensea.io/assets/base/${nft.contractAddress}/${nft.tokenId}`)}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-muted transition-colors text-left"
            >
              <span className="text-sm text-foreground hover:underline">OpenSea</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </Card>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleSetAvatar}
            >
              Set as avatar
            </Button>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setShowSendModal(true)}
            >
              Send
            </Button>
          </div>
          <Button variant="outline" className="w-full bg-transparent" onClick={handleHide}>
            {nft.isHiddenPage ? "Unhide" : "Hide NFT"}
          </Button>
        </div>
      </div>

      <SendNFTModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} nftIds={[nft.id]} nftData={[nft]} />
    </div>
  )
}
