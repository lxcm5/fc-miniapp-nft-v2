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
  const { walletAddress, isWalletConnected, isSDKLoaded } = useFarcaster()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNFTs = async () => {
      console.log("[v0] === NFT FETCH DEBUG ===")
      console.log("[v0] SDK loaded:", isSDKLoaded)
      console.log("[v0] Wallet connected:", isWalletConnected)
      console.log("[v0] Wallet address:", walletAddress)
      console.log("[v0] Address type:", typeof walletAddress)
      console.log("[v0] Address length:", walletAddress?.length)

      if (!walletAddress) {
        console.log("[v0] ❌ No wallet address, stopping fetch")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const alchemyUrl = `https://base-mainnet.g.alchemy.com/nft/v3/pSYF7FVv63ho_VUplwQrK/getNFTsForOwner?owner=${walletAddress}&withMetadata=true&pageSize=12`

        console.log("[v0] 🚀 Fetching NFTs from:", alchemyUrl)
        const response = await fetch(alchemyUrl)
        console.log("[v0] 📡 Response status:", response.status)
        console.log("[v0] 📡 Response ok:", response.ok)

        const data = await response.json()
        console.log("[v0] 📦 API Response:", JSON.stringify(data, null, 2))

        if (data.ownedNfts && data.ownedNfts.length > 0) {
          console.log("[v0] ✅ Found", data.ownedNfts.length, "NFTs")
          const formattedNFTs = data.ownedNfts.slice(0, 12).map((nft: any) => ({
            id: `${nft.contract.address}-${nft.tokenId}`,
            name: nft.name || nft.contract.name || "Unnamed NFT",
            collection: nft.contract.name || "Unknown Collection",
            image:
              nft.image?.cachedUrl ||
              nft.image?.thumbnailUrl ||
              nft.image?.originalUrl ||
              "/digital-art-collection.png",
            tokenId: nft.tokenId,
            contractAddress: nft.contract.address,
          }))
          console.log("[v0] 🎨 Formatted NFTs:", formattedNFTs)
          setNfts(formattedNFTs)
        } else {
          console.log("[v0] ⚠️ No NFTs found in response")
          setNfts([])
        }
      } catch (error) {
        console.error("[v0] ❌ Error fetching NFTs:", error)
        setNfts([])
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [walletAddress, isWalletConnected]) // Removed isSDKLoaded dependency

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
        <p>No NFTs found in your wallet on Base network</p>
        {walletAddress && (
          <p className="text-xs mt-2">
            Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        )}
        {!walletAddress && <p className="text-xs mt-2">Wallet address not detected</p>}
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
