"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFarcaster } from "@/app/providers"
import { useEffect, useState } from "react"
import { Copy, Check, Eye, EyeOff } from "lucide-react"

interface WalletBalanceProps {
  /** Override address to display another wallet's balance and NFT stats */
  address?: string
}

export function WalletBalance({ address: addressProp }: WalletBalanceProps = {}) {
  const { isSDKLoaded, walletAddress, ethBalance, isWalletConnected, connectWallet } = useFarcaster()
  const effectiveAddress = addressProp || walletAddress
  const [nftCount, setNftCount] = useState<number>(0)
  const [nftTotalValue, setNftTotalValue] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const [overrideEthBalance, setOverrideEthBalance] = useState<string | null>(null)
  const [balanceHidden, setBalanceHidden] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("balance_hidden") === "true"
    }
    return false
  })

  const toggleBalanceHidden = () => {
    setBalanceHidden((prev) => {
      const next = !prev
      localStorage.setItem("balance_hidden", String(next))
      return next
    })
  }

  // Fetch ETH balance for overridden address
  useEffect(() => {
    if (!addressProp) {
      setOverrideEthBalance(null)
      return
    }
    const fetchOverrideBalance = async () => {
      try {
        const response = await fetch("https://mainnet.base.org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getBalance",
            params: [addressProp, "latest"],
            id: 1,
          }),
        })
        const data = await response.json()
        if (data.result) {
          const balanceInWei = BigInt(data.result)
          const balanceInEth = Number(balanceInWei) / 1e18
          setOverrideEthBalance(balanceInEth.toFixed(4))
        }
      } catch (error) {
        console.error("[v0] Error fetching override balance:", error)
        setOverrideEthBalance("0.0000")
      }
    }
    fetchOverrideBalance()
  }, [addressProp])

  useEffect(() => {
    const fetchNFTStats = async () => {
      if (!effectiveAddress) return

      try {
        const response = await fetch(`/api/nfts?address=${effectiveAddress}`)
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
  }, [effectiveAddress])

  const handleCopy = () => {
    if (effectiveAddress) {
      navigator.clipboard.writeText(effectiveAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const displayEthBalance = addressProp ? overrideEthBalance : ethBalance
  const ethToUsd = 2850
  const usdBalance = displayEthBalance ? (Number.parseFloat(displayEthBalance) * ethToUsd).toFixed(2) : "0.00"
  const nftUsdValue = (nftTotalValue * ethToUsd).toFixed(2)

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-start justify-between">
        {/* Left side - ETH Balance */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-muted-foreground">Wallet Balance</p>
            {isWalletConnected && ethBalance !== null && (
              <button
                onClick={toggleBalanceHidden}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={balanceHidden ? "Show balance" : "Hide balance"}
              >
                {balanceHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
          {isSDKLoaded ? (
            <>
              {(isWalletConnected || addressProp) && (displayEthBalance !== null || addressProp) ? (
                <>
                  <h2 className="text-[1.44rem] font-semibold text-foreground">{balanceHidden ? "••••" : `${displayEthBalance ?? "..."} ETH`}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{balanceHidden ? "••••" : `≈ $${usdBalance} USD`}</p>
                  {effectiveAddress && (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-muted-foreground font-mono">
                        {effectiveAddress.slice(0, 6)}...{effectiveAddress.slice(-4)}
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
        {(isWalletConnected || addressProp) ? (
          <div className="flex-1 text-right">
            <p className="text-sm text-muted-foreground mb-1">NFT Collection</p>
            <h2 className="text-[1.44rem] font-semibold text-foreground">{nftCount} NFTs</h2>
            <p className="text-sm text-muted-foreground mt-1">{balanceHidden ? "••••" : `≈ ${nftTotalValue.toFixed(3)} ETH`}</p>
            <p className="text-xs text-muted-foreground mt-1">{balanceHidden ? "••••" : `≈ $${nftUsdValue} USD`}</p>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
