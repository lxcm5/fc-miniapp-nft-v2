"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFarcaster } from "@/app/providers"
import { useEffect, useState } from "react"
import { Copy, Check } from "lucide-react"

export function WalletBalance() {
  const { isSDKLoaded, walletAddress, ethBalance, isWalletConnected, connectWallet } = useFarcaster()
  const [nftCount, setNftCount] = useState<number>(0)
  const [nftTotalValue, setNftTotalValue] = useState<number>(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchNFTStats = async () => {
      if (!walletAddress) return

      try {
        const response = await fetch(`/api/nfts?address=${walletAddress}`)
        const data = await response.json()

        if (data.error) {
          console.error("[v0] Error from API:", data.error)
          return
        }

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
    }

    fetchNFTStats()
  }, [walletAddress])

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const ethToUsd = 2850
  const usdBalance = ethBalance ? (Number.parseFloat(ethBalance) * ethToUsd).toFixed(2) : "0.00"
  const nftUsdValue = (nftTotalValue * ethToUsd).toFixed(2)

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-start justify-between">
        {/* Left side - ETH Balance */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
          {isSDKLoaded ? (
            <>
              {isWalletConnected && ethBalance !== null ? (
                <>
                  <h2 className="text-[1.44rem] font-semibold text-foreground">{ethBalance} ETH</h2>
                  <p className="text-sm text-muted-foreground mt-1">≈ ${usdBalance} USD</p>
                  {walletAddress && (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-muted-foreground font-mono">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </p>
                      <button
                        onClick={handleCopy}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy address"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-3">Connect your wallet to see balance</p>
                  <Button onClick={connectWallet} size="sm" className="bg-primary hover:bg-primary/90">
                    Connect Wallet
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          )}
        </div>

        {/* Right side - NFT Stats (aligned with left side) */}
        {isWalletConnected && ethBalance !== null ? (
          <div className="flex-1 text-right">
            <p className="text-sm text-muted-foreground mb-1">NFT Collection</p>
            <h2 className="text-[1.44rem] font-semibold text-foreground">{nftCount} NFTs</h2>
            <p className="text-sm text-muted-foreground mt-1">≈ {nftTotalValue.toFixed(3)} ETH</p>
            <p className="text-xs text-muted-foreground mt-1">≈ ${nftUsdValue} USD</p>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
