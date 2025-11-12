"use client"

import { Card } from "@/components/ui/card"
import Image from "next/image"
import { useFarcaster } from "@/app/providers"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface NFT {
  id: string
  name: string
  collection: string
  image: string
  tokenId: string
  contractAddress: string
  floorPrice?: string
}

interface NFTGridProps {
  gridMode: 2 | 3 | 4 | "list"
}

export function NFTGrid({ gridMode }: NFTGridProps) {
  const { walletAddress, isWalletConnected } = useFarcaster()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!walletAddress) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const alchemyUrl = `https://base-mainnet.g.alchemy.com/nft/v3/pSYF7FVv63ho_VUplwQrK/getNFTsForOwner?owner=${walletAddress}&withMetadata=true&pageSize=12`

        const response = await fetch(alchemyUrl)
        const data = await response.json()

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
            floorPrice: nft.contract.openSeaMetadata?.floorPrice?.toString() || "—",
          }))
          setNfts(formattedNFTs)
        } else {
          setNfts([])
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

  const gridCols =
    gridMode === "list"
      ? "grid-cols-1"
      : gridMode === 2
        ? "grid-cols-2"
        : gridMode === 3
          ? "grid-cols-2 md:grid-cols-3"
          : "grid-cols-2 md:grid-cols-4"

  const handleNFTClick = (nft: NFT) => {
    const nftData = encodeURIComponent(JSON.stringify(nft))
    router.push(`/nft/${nft.contractAddress}/${nft.tokenId}?data=${nftData}`)
  }

  if (loading) {
    return (
      <div className={`grid ${gridCols} gap-3`}>
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden border-border bg-card">
            <div className="aspect-square relative bg-muted animate-pulse" />
            <div className="p-2">
              <div className="h-4 bg-muted animate-pulse rounded mb-1.5" />
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
      </div>
    )
  }

  if (gridMode === "list") {
    return (
      <div className="space-y-2">
        {nfts.map((nft) => (
          <Card
            key={nft.id}
            className="overflow-hidden border-border hover:shadow-lg transition-shadow cursor-pointer bg-card"
            onClick={() => handleNFTClick(nft)}
          >
            <div className="flex items-center gap-3 p-3">
              <div className="w-20 h-20 relative bg-muted rounded flex-shrink-0">
                <Image src={nft.image || "/placeholder.svg"} alt={nft.name} fill className="object-cover rounded" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate">{nft.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{nft.collection}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Token ID: {nft.tokenId}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {nfts.map((nft) => (
        <Card
          key={nft.id}
          className="overflow-hidden border-border hover:shadow-lg transition-shadow cursor-pointer bg-card"
          onClick={() => handleNFTClick(nft)}
        >
          <div className="aspect-square relative bg-muted">
            <Image src={nft.image || "/placeholder.svg"} alt={nft.name} fill className="object-cover" />
          </div>
          <div className="p-2">
            <h3 className="font-semibold text-sm text-foreground truncate">{nft.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{nft.collection}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
