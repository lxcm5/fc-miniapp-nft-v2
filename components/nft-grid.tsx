"use client"

import { Card } from "@/components/ui/card"
import Image from "next/image"
import { useFarcaster } from "@/app/providers"
import { useEffect, useState } from "react"

interface NFT {
  id: string
  name: string
  collection: string
  image: string
  tokenId: string
  contractAddress: string
}

export function NFTGrid() {
  const { walletAddress, isWalletConnected } = useFarcaster()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!walletAddress) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Using Alchemy public API for Base network
        const response = await fetch(
          `https://base-mainnet.g.alchemy.com/nft/v3/docs-demo/getNFTsForOwner?owner=${walletAddress}&withMetadata=true&pageSize=12`,
        )

        const data = await response.json()

        if (data.ownedNfts && data.ownedNfts.length > 0) {
          const formattedNFTs = data.ownedNfts.slice(0, 12).map((nft: any) => ({
            id: `${nft.contract.address}-${nft.tokenId}`,
            name: nft.name || nft.contract.name || "Unnamed NFT",
            collection: nft.contract.name || "Unknown Collection",
            image:
              nft.image?.thumbnailUrl ||
              nft.image?.cachedUrl ||
              nft.image?.originalUrl ||
              "/placeholder.svg?height=400&width=400",
            tokenId: nft.tokenId,
            contractAddress: nft.contract.address,
          }))
          setNfts(formattedNFTs)
        } else {
          setNfts([])
        }
      } catch (error) {
        console.error("Error fetching NFTs:", error)
        setNfts([])
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [walletAddress])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden border-border bg-card">
            <div className="aspect-square relative bg-muted animate-pulse" />
            <div className="p-3">
              <div className="h-4 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!isWalletConnected) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Connect your wallet to view your NFTs</p>
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No NFTs found in your wallet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {nfts.map((nft) => (
        <Card
          key={nft.id}
          className="overflow-hidden border-border hover:shadow-lg transition-shadow cursor-pointer bg-card"
        >
          <div className="aspect-square relative bg-muted">
            <Image src={nft.image || "/placeholder.svg"} alt={nft.name} fill className="object-cover" />
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-sm text-foreground truncate">{nft.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{nft.collection}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
