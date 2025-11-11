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
      console.log("[v0] NFTGrid useEffect triggered")
      console.log("[v0] Wallet address:", walletAddress)
      console.log("[v0] Is wallet connected:", isWalletConnected)

      if (!walletAddress) {
        console.log("[v0] No wallet address available, skipping NFT fetch")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log("[v0] Starting NFT fetch for address:", walletAddress)

        const alchemyUrl = `https://base-mainnet.g.alchemy.com/nft/v3/7u5ZqwwJfvQ0-EXdDXaU4n9UZAWCrBXq/getNFTsForOwner?owner=${walletAddress}&withMetadata=true&pageSize=12`

        console.log("[v0] Fetching from Alchemy API...")
        const response = await fetch(alchemyUrl)
        console.log("[v0] Alchemy API response status:", response.status)

        const data = await response.json()
        console.log("[v0] Alchemy data received:", JSON.stringify(data, null, 2))

        if (data.ownedNfts && data.ownedNfts.length > 0) {
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
          console.log("[v0] Formatted NFTs from Alchemy:", formattedNFTs)
          setNfts(formattedNFTs)
        } else {
          console.log("[v0] No NFTs found in Alchemy response")
          // Fallback to SimpleHash API
          const simpleHashUrl = `https://api.simplehash.com/api/v0/nfts/owners?chains=base&wallet_addresses=${walletAddress}&limit=12`

          console.log("[v0] Fetching from SimpleHash API...")
          const simpleHashResponse = await fetch(simpleHashUrl, {
            headers: {
              Accept: "application/json",
              "X-API-KEY": "simplehash_public_demo",
            },
          })
          console.log("[v0] SimpleHash API response status:", simpleHashResponse.status)

          const simpleHashData = await simpleHashResponse.json()
          console.log("[v0] SimpleHash data received:", simpleHashData)

          if (simpleHashData.nfts && simpleHashData.nfts.length > 0) {
            const formattedSimpleHashNFTs = simpleHashData.nfts.slice(0, 12).map((nft: any) => ({
              id: `${nft.contract_address}-${nft.token_id}`,
              name: nft.name || nft.collection?.name || "Unnamed NFT",
              collection: nft.collection?.name || "Unknown Collection",
              image:
                nft.image_url ||
                nft.previews?.image_medium_url ||
                nft.previews?.image_small_url ||
                "/digital-art-collection.png",
              tokenId: nft.token_id,
              contractAddress: nft.contract_address,
            }))
            console.log("[v0] Formatted NFTs from SimpleHash:", formattedSimpleHashNFTs)
            setNfts(formattedSimpleHashNFTs)
          } else {
            console.log("[v0] No NFTs found in SimpleHash response")
            setNfts([])
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching NFTs:", error)
        setNfts([])
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [walletAddress, isWalletConnected])

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
