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
  tokenType?: string
  floorPrice?: string
  description?: string
  traits?: Array<{ trait_type: string; value: string; trait_count: number }>
  supply?: number
  rawMetadata?: any
}

interface NFTGridProps {
  gridMode: 2 | 3 | 4 | "list"
  selectedNFTs: string[]
  setSelectedNFTs: (ids: string[]) => void
  isSelectionMode: boolean
  setIsSelectionMode: (mode: boolean) => void
  isHiddenPage: boolean
  sortBy?: "date" | "name" | "collection" | "floor"
  sortDirection?: "asc" | "desc"
}

export function NFTGrid({
  gridMode,
  selectedNFTs,
  setSelectedNFTs,
  isSelectionMode,
  setIsSelectionMode,
  isHiddenPage,
  sortBy = "date",
  sortDirection = "desc",
}: NFTGridProps) {
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

        const response = await fetch(`/api/nfts?address=${walletAddress}`)
        const data = await response.json()

        if (data.error) {
          console.error("[v0] Error from API:", data.error)
          setNfts([])
          return
        }

        const allNFTs = data.nfts || []
        console.log(`[v0] Total NFTs loaded: ${allNFTs.length}`)

        if (allNFTs.length > 0) {
          const hiddenNFTs = JSON.parse(localStorage.getItem("hidden_nfts") || "[]")

          const formattedNFTs = allNFTs.map((nft: any) => {
            const nftId = `${nft.contract.address}-${nft.tokenId}`

            const tokenIdNum = Number.parseInt(nft.tokenId, 16)
            if (tokenIdNum === 0 && !hiddenNFTs.includes(nftId)) {
              console.log(`[v0] Auto-hiding NFT with tokenId = 0: ${nftId}`)
              hiddenNFTs.push(nftId)
            }

            const isSpam =
              nft.contract.isSpam ||
              nft.spam?.isSpam ||
              nft.name?.toLowerCase().includes("claim") ||
              nft.name?.toLowerCase().includes("reward") ||
              nft.name?.toLowerCase().includes("airdrop")

            if (isSpam && !hiddenNFTs.includes(nftId)) {
              console.log(`[v0] Auto-hiding spam NFT: ${nft.name}`)
              hiddenNFTs.push(nftId)
            }

            return {
              id: nftId,
              name: nft.name || nft.contract.name || "Unnamed NFT",
              collection: nft.contract.name || "Unknown Collection",
              image:
                nft.image?.cachedUrl ||
                nft.image?.thumbnailUrl ||
                nft.image?.originalUrl ||
                "/digital-art-collection.png",
              tokenId: nft.tokenId,
              contractAddress: nft.contract.address,
              tokenType: nft.contract.tokenType,
              floorPrice: nft.contract.openSeaMetadata?.floorPrice?.toString() || "—",
              description: nft.raw?.metadata?.description || nft.description,
              traits:
                nft.raw?.metadata?.attributes?.map((attr: any) => ({
                  trait_type: attr.trait_type,
                  value: attr.value,
                  trait_count: attr.trait_count,
                })) || [],
              supply: nft.contract.totalSupply,
              rawMetadata: nft.raw?.metadata,
            }
          })

          localStorage.setItem("hidden_nfts", JSON.stringify(hiddenNFTs))

          const filteredNFTs = formattedNFTs.filter((nft: NFT) => {
            if (isHiddenPage) {
              return hiddenNFTs.includes(nft.id)
            } else {
              return !hiddenNFTs.includes(nft.id)
            }
          })

          console.log(`[v0] Filtered NFTs: ${filteredNFTs.length}, Hidden: ${hiddenNFTs.length}`)
          setNfts(filteredNFTs)
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
  }, [walletAddress, isWalletConnected, isHiddenPage])

  const sortedNfts = [...nfts].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "date":
        // Keep original order (date added to wallet)
        comparison = 0
        break
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "collection":
        comparison = a.collection.localeCompare(b.collection)
        break
      case "floor":
        const floorA = a.floorPrice === "—" ? -1 : Number.parseFloat(a.floorPrice || "0")
        const floorB = b.floorPrice === "—" ? -1 : Number.parseFloat(b.floorPrice || "0")

        // Put NFTs without floor at the bottom
        if (floorA === -1 && floorB === -1) comparison = 0
        else if (floorA === -1) comparison = 1
        else if (floorB === -1) comparison = -1
        else comparison = floorA - floorB
        break
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  const gridCols =
    gridMode === "list"
      ? "grid-cols-1"
      : gridMode === 2
        ? "grid-cols-2"
        : gridMode === 3
          ? "grid-cols-3"
          : "grid-cols-4"

  const handleNFTClick = (nft: NFT) => {
    if (isSelectionMode) {
      toggleSelection(nft.id)
    } else {
      const nftData = encodeURIComponent(JSON.stringify({ ...nft, isHiddenPage }))
      router.push(`/nft/${nft.contractAddress}/${nft.tokenId}?data=${nftData}`)
    }
  }

  const handleLongPress = (nftId: string) => {
    setIsSelectionMode(true)
    setSelectedNFTs([nftId])
  }

  const toggleSelection = (nftId: string) => {
    if (selectedNFTs.includes(nftId)) {
      const updated = selectedNFTs.filter((id) => id !== nftId)
      setSelectedNFTs(updated)
      if (updated.length === 0) {
        setIsSelectionMode(false)
      }
    } else {
      setSelectedNFTs([...selectedNFTs, nftId])
    }
  }

  if (loading) {
    return (
      <div className={`grid ${gridCols} gap-3`}>
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden border-border bg-card">
            <div className="aspect-square relative bg-muted animate-pulse" />
            <div className="p-2">
              <div className="h-4 bg-muted animate-pulse rounded mb-1" />
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
        <p>{isHiddenPage ? "No hidden NFTs" : "No NFTs found in your wallet on Base network"}</p>
      </div>
    )
  }

  if (gridMode === "list") {
    return (
      <div className="space-y-2">
        {sortedNfts.map((nft) => {
          const isSelected = selectedNFTs.includes(nft.id)
          return (
            <Card
              key={nft.id}
              className={`overflow-hidden border-border hover:shadow-lg transition-shadow cursor-pointer bg-card relative ${isSelected ? "ring-2 ring-primary" : ""} p-0`}
              onClick={() => handleNFTClick(nft)}
              onContextMenu={(e) => {
                e.preventDefault()
                handleLongPress(nft.id)
              }}
              onTouchStart={(e) => {
                const startY = e.touches[0].clientY
                const startX = e.touches[0].clientX
                const timeout = setTimeout(() => handleLongPress(nft.id), 500)
                ;(e.currentTarget as any).longPressTimeout = timeout
                ;(e.currentTarget as any).startY = startY
                ;(e.currentTarget as any).startX = startX
              }}
              onTouchMove={(e) => {
                const currentY = e.touches[0].clientY
                const currentX = e.touches[0].clientX
                const startY = (e.currentTarget as any).startY || currentY
                const startX = (e.currentTarget as any).startX || currentX

                // If moved more than 10px, it's a scroll not a long press
                if (Math.abs(currentY - startY) > 10 || Math.abs(currentX - startX) > 10) {
                  clearTimeout((e.currentTarget as any).longPressTimeout)
                }
              }}
              onTouchEnd={(e) => {
                clearTimeout((e.currentTarget as any).longPressTimeout)
              }}
            >
              <div className="flex items-center h-16">
                <div className="w-16 h-16 relative bg-muted flex-shrink-0">
                  <Image src={nft.image || "/placeholder.svg"} alt={nft.name} fill className="object-cover" />
                </div>
                <div className="flex flex-col justify-center px-3 min-w-0 flex-1 gap-0.5">
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">{nft.collection}</p>
                  <p className="text-sm font-medium truncate leading-tight">{nft.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Floor: {nft.floorPrice} {nft.floorPrice !== "—" && "ETH"}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {sortedNfts.map((nft) => {
        const isSelected = selectedNFTs.includes(nft.id)
        return (
          <Card
            key={nft.id}
            className={`overflow-hidden border-border hover:shadow-lg transition-shadow cursor-pointer bg-card relative ${isSelected ? "ring-2 ring-primary" : ""} p-0`}
            onClick={() => handleNFTClick(nft)}
            onContextMenu={(e) => {
              e.preventDefault()
              handleLongPress(nft.id)
            }}
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY
              const startX = e.touches[0].clientX
              const timeout = setTimeout(() => handleLongPress(nft.id), 500)
              ;(e.currentTarget as any).longPressTimeout = timeout
              ;(e.currentTarget as any).startY = startY
              ;(e.currentTarget as any).startX = startX
            }}
            onTouchMove={(e) => {
              const currentY = e.touches[0].clientY
              const currentX = e.touches[0].clientX
              const startY = (e.currentTarget as any).startY || currentY
              const startX = (e.currentTarget as any).startX || currentX

              // If moved more than 10px, it's a scroll not a long press
              if (Math.abs(currentY - startY) > 10 || Math.abs(currentX - startX) > 10) {
                clearTimeout((e.currentTarget as any).longPressTimeout)
              }
            }}
            onTouchEnd={(e) => {
              clearTimeout((e.currentTarget as any).longPressTimeout)
            }}
          >
            <div className={`relative bg-muted ${gridMode === 2 ? "h-40 w-full" : "aspect-square w-full"}`}>
              <Image src={nft.image || "/placeholder.svg"} alt={nft.name} fill className="object-cover" />
              {gridMode === 2 && (
                <div className="absolute bottom-1 left-1 bg-black/10 rounded px-1.5 py-0.5 max-w-[90%] backdrop-blur-[2px]">
                  <p className="text-[10px] text-white truncate font-medium leading-tight">{nft.collection}</p>
                  <p className="text-[10px] text-white truncate font-medium leading-tight">{nft.name}</p>
                </div>
              )}
              {gridMode === 3 && (
                <div className="absolute bottom-1 left-1 bg-black/10 rounded px-1.5 py-0.5 max-w-[90%] backdrop-blur-[2px]">
                  <p className="text-[8px] text-white truncate font-medium leading-tight">{nft.collection}</p>
                </div>
              )}
              {gridMode === 4 && (
                <div className="absolute bottom-1 left-1 bg-black/10 rounded px-1.5 py-0.5 max-w-[90%] backdrop-blur-[2px]">
                  <p className="text-[8px] text-white truncate font-medium leading-tight">{nft.collection}</p>
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
