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
  const [isSuccess, setIsSuccess] = useState(false)
  const { walletAddress, sdk } = useFarcaster()

  useEffect(() => {
    if (amount) {
      const usd = (Number(amount) * 2500).toFixed(2)
      setUsdValue(usd)
    } else {
      setUsdValue("")
    }
  }, [amount])

  useEffect(() => {
    if (open) {
      setIsSuccess(false)
      setAmount("")
    }
  }, [open])

  const RECIPIENT_ADDRESS = "0xdBB9f76DC289B4cec58BCfe10923084F96Fa6Aee"

  const handleSend = async () => {
    if (!amount || !sdk?.actions?.sendToken) {
      return
    }

    setIsLoading(true)
    setIsSuccess(false)
    try {
      await sdk.actions.sendToken({
        recipientAddress: RECIPIENT_ADDRESS,
        amount: amount,
        symbol: "ETH",
        chainId: 8453,
      })

      setIsSuccess(true)
      setAmount("")

      // Auto-close after 2 seconds
      setTimeout(() => {
        onOpenChange(false)
        setIsSuccess(false)
      }, 2000)
    } catch (error) {
      setIsLoading(false)
      onOpenChange(false)
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
            disabled={!amount || isLoading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isSuccess ? "Thanks 🙏🏻" : isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
