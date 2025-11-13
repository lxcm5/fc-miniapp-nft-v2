"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useFarcaster } from "@/app/providers"

interface SendNFTModalProps {
  isOpen: boolean
  onClose: () => void
  nftIds: string[]
  nftData?: any[]
}

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  addresses: { verifiedAddresses: { ethAddresses: string[] } }
}

export function SendNFTModal({ isOpen, onClose, nftIds, nftData }: SendNFTModalProps) {
  const [step, setStep] = useState<"recipient" | "confirm" | "success">("recipient")
  const [recipient, setRecipient] = useState("")
  const [searchResults, setSearchResults] = useState<FarcasterUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const { walletAddress } = useFarcaster()

  const myVerifiedAddresses = [walletAddress].filter(Boolean)

  useEffect(() => {
    const searchUsers = async () => {
      if (recipient.length < 2 || recipient.startsWith("0x")) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(
          `https://searchcaster.xyz/api/search?text=${encodeURIComponent(recipient)}&limit=5`,
        )
        const data = await response.json()
        console.log("[v0] Farcaster search results:", data)
        setSearchResults(data.casts || [])
      } catch (error) {
        console.error("[v0] Error searching Farcaster users:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(searchUsers, 300)
    return () => clearTimeout(timeoutId)
  }, [recipient])

  const handleSelectRecipient = (address: string) => {
    setRecipient(address)
    setSearchResults([])
    setStep("confirm")
  }

  const handleSend = async () => {
    setIsSending(true)
    console.log("[v0] Sending NFTs to:", recipient)
    console.log("[v0] NFT data:", nftData)

    try {
      const sdk = (await import("@farcaster/frame-sdk")).default

      if (!sdk?.wallet?.ethProvider) {
        throw new Error("No wallet found - Please open in Farcaster app")
      }

      const { ethers } = await import("ethers")

      const provider = new ethers.BrowserProvider(sdk.wallet.ethProvider)
      const signer = await provider.getSigner()

      console.log("[v0] Using Farcaster wallet, signer address:", await signer.getAddress())

      const ERC721_ABI = ["function safeTransferFrom(address from, address to, uint256 tokenId)"]

      for (const nft of nftData || []) {
        console.log("[v0] Sending NFT:", nft.tokenId, "from contract:", nft.contractAddress)
        const contract = new ethers.Contract(nft.contractAddress, ERC721_ABI, signer)
        const tx = await contract.safeTransferFrom(walletAddress, recipient, nft.tokenId)
        console.log("[v0] Transaction sent:", tx.hash)
        await tx.wait()
        console.log("[v0] Transaction confirmed:", tx.hash)
      }

      setStep("success")
    } catch (error) {
      console.error("[v0] Error sending NFT:", error)
      alert(`Error sending NFT: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep("recipient")
      setRecipient("")
      setSearchResults([])
    }, 300)
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

                {isSearching && <div className="mt-2 p-2 text-sm text-muted-foreground">Searching...</div>}

                {searchResults.length > 0 && (
                  <div className="mt-2 border border-border rounded-lg overflow-hidden">
                    {searchResults.map((user) => (
                      <button
                        key={user.fid}
                        onClick={() => {
                          const address = user.addresses?.verifiedAddresses?.ethAddresses?.[0]
                          if (address) {
                            handleSelectRecipient(address)
                          }
                        }}
                        className="w-full text-left p-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          {user.pfpUrl && (
                            <img src={user.pfpUrl || "/placeholder.svg"} alt="" className="w-8 h-8 rounded-full" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{user.displayName}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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

              {recipient && !searchResults.length && (
                <Button onClick={() => setStep("confirm")} className="w-full">
                  Continue
                </Button>
              )}
            </div>
          </>
        ) : step === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Send</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg overflow-hidden">
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Sending to</p>
                  <p className="text-sm font-mono font-medium">
                    {recipient.slice(0, 6)}...{recipient.slice(-4)}
                  </p>
                </div>

                <div className="h-[3px] bg-background/50" />

                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">NFTs</p>
                  <p className="text-sm font-medium">{nftIds.length} NFT(s)</p>
                </div>

                <div className="h-[3px] bg-background/50" />

                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Chain</p>
                  <p className="text-sm font-medium">Base</p>
                </div>

                <div className="h-[3px] bg-background/50" />

                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Fees</p>
                  <p className="text-sm font-medium">~$0.01</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setStep("recipient")} disabled={isSending}>
                  Back
                </Button>
                <Button onClick={handleSend} className="bg-primary" disabled={isSending}>
                  {isSending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Send Complete</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-lg font-medium">Send complete</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {nftIds.length} NFT(s) sent to {recipient.slice(0, 6)}...{recipient.slice(-4)}
                </p>
              </div>

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
