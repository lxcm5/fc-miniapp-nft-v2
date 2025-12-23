"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useFarcaster } from "@/app/providers"

interface DonateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DonateModal({ open, onOpenChange }: DonateModalProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { walletAddress } = useFarcaster()

  const RECIPIENT_ADDRESS = "0xdBB9f76DC289B4cec58BCfe10923084F96Fa6Aee"

  const handleSend = async () => {
    if (!amount || !walletAddress) return

    setIsLoading(true)
    try {
      // TODO: Implement actual donation transaction using ethers.js
      console.log(`Sending ${amount} ETH from ${walletAddress} to ${RECIPIENT_ADDRESS}`)

      await new Promise((resolve) => setTimeout(resolve, 500))
      setAmount("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error sending donation:", error)
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
            <Input
              type="number"
              placeholder="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.001"
              className="bg-background text-foreground"
            />
          </div>
          {amount && (
            <p className="text-xs text-muted-foreground">
              To: {RECIPIENT_ADDRESS.slice(0, 6)}...{RECIPIENT_ADDRESS.slice(-4)}
            </p>
          )}
          <Button
            onClick={handleSend}
            disabled={!amount || isLoading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
