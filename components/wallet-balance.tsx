"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFarcaster } from "@/app/providers"

export function WalletBalance() {
  const { isSDKLoaded, walletAddress, ethBalance, isWalletConnected, connectWallet } = useFarcaster()

  const ethToUsd = 2850
  const usdBalance = ethBalance ? (Number.parseFloat(ethBalance) * ethToUsd).toFixed(2) : "0.00"

  return (
    <Card className="p-5 bg-card border-border">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
          {isSDKLoaded ? (
            <>
              {isWalletConnected && ethBalance !== null ? (
                <>
                  <h2 className="text-2xl font-semibold text-foreground">{ethBalance} ETH</h2>
                  <p className="text-sm text-muted-foreground mt-1">≈ ${usdBalance} USD</p>
                  {walletAddress && (
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
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
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
          <svg
            className="w-7 h-7 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
    </Card>
  )
}
