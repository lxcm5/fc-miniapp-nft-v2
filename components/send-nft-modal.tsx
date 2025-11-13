"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useFarcaster } from "@/app/providers"

interface SendNFTModalProps {
  isOpen: boolean
  onClose: () => void
  nftIds: string[]
}

export function SendNFTModal({ isOpen, onClose, nftIds }: SendNFTModalProps) {
  const [step, setStep] = useState<"recipient" | "confirm">("recipient")
  const [recipient, setRecipient] = useState("")
  const { walletAddress } = useFarcaster()

  const myVerifiedAddresses = [walletAddress].filter(Boolean)

  const handleSelectRecipient = (address: string) => {
    setRecipient(address)
    setStep("confirm")
  }

  const handleSend = () => {
    console.log("[v0] Sending NFTs to:", recipient)
    alert(`Sending ${nftIds.length} NFT(s) to ${recipient}`)
    onClose()
    setStep("recipient")
    setRecipient("")
  }

  const handleClose = () => {
    onClose()
    setStep("recipient")
    setRecipient("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "recipient" ? (
          <>
            <DialogHeader>
              <DialogTitle>Send</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">To</label>
                <Input
                  placeholder="Address or username"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full"
                />
              </div>

              {myVerifiedAddresses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">My verified addresses</h3>
                  <div className="space-y-2">
                    {myVerifiedAddresses.map((address) => (
                      <button
                        key={address}
                        onClick={() => handleSelectRecipient(address || "")}
                        className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <p className="text-sm font-mono">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium mb-2">Recents</h3>
                <p className="text-sm text-muted-foreground">No recent recipients</p>
              </div>

              {recipient && (
                <Button onClick={() => setStep("confirm")} className="w-full">
                  Continue
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Send</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Sending to</p>
                <p className="text-sm font-mono font-medium">
                  {recipient.slice(0, 6)}...{recipient.slice(-4)}
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">NFTs</p>
                <p className="text-sm font-medium">{nftIds.length} NFT(s)</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setStep("recipient")}>
                  Back
                </Button>
                <Button onClick={handleSend} className="bg-primary">
                  Send
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
