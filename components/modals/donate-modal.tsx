"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useFarcaster } from "@/app/providers"

interface DonateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DonateModal({ open, onOpenChange }: DonateModalProps) {
  const [amount, setAmount] = useState("")
  const [usdValue, setUsdValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { walletAddress, sdk } = useFarcaster()

  useEffect(() => {
    if (amount) {
      const usd = (Number(amount) * 2500).toFixed(2)
      setUsdValue(usd)
    } else {
      setUsdValue("")
    }
  }, [amount])

  const RECIPIENT_ADDRESS = "0x11414661E194b8b0D7248E789c1d41332904f2bA"

  const handleSend = async () => {
    if (!amount || !walletAddress || !sdk) {
      console.log("[v0] Missing fields - walletAddress:", walletAddress, "sdk:", !!sdk)
      alert("Please connect your wallet first")
      return
    }

    const confirmSend = window.confirm(`Send ${amount} ETH (≈ $${usdValue}) to ${RECIPIENT_ADDRESS}?`)
    if (!confirmSend) return

    setIsLoading(true)
    try {
      const amountInWei = String(BigInt(Math.floor(Number(amount) * 1e18)))
      console.log(`[v0] Attempting to send ${amount} ETH from ${walletAddress}`)

      const txHash = await sdk.wallet.ethProvider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: walletAddress,
            to: RECIPIENT_ADDRESS,
            value: amountInWei,
            gas: "21000",
          },
        ],
      })

      console.log("[v0] Transaction sent:", txHash)
      alert("Donation sent successfully!")
      setAmount("")
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error sending donation:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Donate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Amount (ETH)</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.001"
                className="bg-background text-foreground flex-1"
              />
              {usdValue && <span className="text-sm text-muted-foreground whitespace-nowrap">≈ ${usdValue}</span>}
            </div>
          </div>
          {walletAddress && (
            <div className="text-xs text-muted-foreground text-center">
              Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          )}
          <Button
            onClick={handleSend}
            disabled={!amount || isLoading || !walletAddress}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
