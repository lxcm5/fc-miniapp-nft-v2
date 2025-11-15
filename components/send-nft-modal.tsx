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
  ethAddress?: string
}

export function SendNFTModal({ isOpen, onClose, nftIds, nftData }: SendNFTModalProps) {
  const [step, setStep] = useState<"recipient" | "confirm" | "success">("recipient")
  const [recipient, setRecipient] = useState("")
  const [selectedUser, setSelectedUser] = useState<FarcasterUser | null>(null)
  const [searchResults, setSearchResults] = useState<FarcasterUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const { walletAddress } = useFarcaster()

  const myVerifiedAddresses = [walletAddress].filter(Boolean)

  useEffect(() => {
    const searchUsers = async () => {
      if (recipient.length < 2) {
        setSearchResults([])
        return
      }

      if (recipient.startsWith("0x") && recipient.length > 10) {
        setIsSearching(true)
        console.log("[v0] Searching by address:", recipient)
        
        try {
          const response = await fetch(
            `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${recipient}&address_types=custody_address,verified_address`,
            {
              headers: {
                'accept': 'application/json',
                'api_key': 'NEYNAR_API_DOCS'
              }
            }
          )
          
          const data = await response.json()
          console.log("[v0] Address search response:", data)

          if (data && Object.keys(data).length > 0) {
            const users = Object.values(data).flat().map((user: any) => {
              const primaryWallet = user.custody_address || user.verified_addresses?.eth_addresses?.[0]
              console.log("[v0] User wallet addresses:", {
                custody: user.custody_address,
                verified: user.verified_addresses?.eth_addresses,
                selected: primaryWallet
              })
              
              return {
                fid: user.fid,
                username: user.username,
                displayName: user.display_name || user.username,
                pfpUrl: user.pfp_url,
                ethAddress: primaryWallet
              }
            })
            
            console.log("[v0] Found users by address:", users)
            setSearchResults(users)
          } else {
            setSearchResults([])
          }
        } catch (error) {
          console.error("[v0] Error searching by address:", error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
        return
      }

      setIsSearching(true)
      console.log("[v0] Searching for username:", recipient)
      
      try {
        const response = await fetch(
          `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(recipient)}&limit=5`,
          {
            headers: {
              'accept': 'application/json',
              'api_key': 'NEYNAR_API_DOCS'
            }
          }
        )
        
        const data = await response.json()
        console.log("[v0] Search response:", data)

        if (data.result?.users && data.result.users.length > 0) {
          const users = data.result.users.map((user: any) => {
            const primaryWallet = user.custody_address || user.verified_addresses?.eth_addresses?.[0]
            console.log("[v0] User wallet addresses:", {
              username: user.username,
              custody: user.custody_address,
              verified: user.verified_addresses?.eth_addresses,
              selected: primaryWallet
            })
            
            return {
              fid: user.fid,
              username: user.username,
              displayName: user.display_name || user.username,
              pfpUrl: user.pfp_url,
              ethAddress: primaryWallet
            }
          }).filter((u: FarcasterUser) => u.ethAddress)
          
          console.log("[v0] Parsed users:", users)
          setSearchResults(users)
        } else {
          setSearchResults([])
        }
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

  const handleSelectRecipient = (address: string, user?: FarcasterUser) => {
    setRecipient(address)
    setSelectedUser(user || null)
    setSearchResults([])
    setStep("confirm")
  }

  const handleSend = async () => {
    setIsSending(true)
    console.log("[v0] ========== STARTING NFT SEND ==========")
    console.log("[v0] Recipient address:", recipient)
    console.log("[v0] Number of NFTs to send:", nftData?.length || 0)
    console.log("[v0] NFT data received:", JSON.stringify(nftData, null, 2))

    try {
      const sdk = (await import("@farcaster/frame-sdk")).default
      console.log("[v0] Farcaster SDK imported:", !!sdk)
      console.log("[v0] SDK.actions available:", !!sdk?.actions)
      console.log("[v0] SDK.actions.sendToken available:", !!sdk?.actions?.sendToken)

      if (!sdk?.actions?.sendToken) {
        throw new Error("Farcaster SDK sendToken not available")
      }

      for (const nft of nftData || []) {
        console.log("[v0] ========== PROCESSING NFT ==========")
        console.log("[v0] Raw NFT object:", JSON.stringify(nft, null, 2))
        
        const contractAddress = nft.contract?.address || nft.contractAddress || nft.contract_address
        const tokenId = nft.tokenId || nft.token_id || nft.id?.tokenId
        
        console.log("[v0] Extracted contract address:", contractAddress)
        console.log("[v0] Extracted token ID:", tokenId)
        console.log("[v0] Token ID type:", typeof tokenId)
        
        if (!contractAddress || !tokenId) {
          console.error("[v0] ERROR: Missing contract or tokenId")
          console.error("[v0] Contract:", contractAddress)
          console.error("[v0] TokenId:", tokenId)
          throw new Error("Missing contract address or token ID")
        }

        const normalizedContract = contractAddress.toLowerCase()
        const normalizedRecipient = recipient.toLowerCase()
        const normalizedTokenId = typeof tokenId === 'string' ? tokenId : tokenId.toString()
        
        const tokenFormats = [
          `eip155:8453/erc721:${normalizedContract}/${normalizedTokenId}`,
          `eip155:8453:erc721:${normalizedContract}:${normalizedTokenId}`,
          `eip155:8453/erc721/${normalizedContract}/${normalizedTokenId}`
        ]
        
        console.log("[v0] Trying CAIP-19 formats:")
        tokenFormats.forEach((format, i) => console.log(`  [${i}]:`, format))

        let lastError = null
        
        for (let i = 0; i < tokenFormats.length; i++) {
          const tokenCAIP = tokenFormats[i]
          console.log(`[v0] ========== ATTEMPT ${i + 1}/${tokenFormats.length} ==========`)
          console.log("[v0] Token CAIP-19:", tokenCAIP)
          console.log("[v0] Recipient:", normalizedRecipient)
          console.log("[v0] Amount:", "1")
          
          try {
            console.log("[v0] Calling sdk.actions.sendToken...")
            const result = await sdk.actions.sendToken({
              token: tokenCAIP,
              amount: "1",
              recipientAddress: normalizedRecipient
            })

            console.log("[v0] Send result:", JSON.stringify(result, null, 2))
            console.log("[v0] Result.success:", result.success)

            if (result.success) {
              console.log("[v0] ✅ NFT SENT SUCCESSFULLY!")
              console.log("[v0] Transaction:", result.send?.transaction)
              break // Success, exit format loop
            } else {
              console.error("[v0] ❌ Send failed")
              console.error("[v0] Reason:", result.reason)
              console.error("[v0] Error:", result.error)
              lastError = new Error(`${result.reason}: ${result.error?.message || 'Unknown error'}`)
            }
          } catch (error: any) {
            console.error(`[v0] ❌ Exception on attempt ${i + 1}:`, error)
            console.error("[v0] Error name:", error?.name)
            console.error("[v0] Error message:", error?.message)
            console.error("[v0] Error stack:", error?.stack)
            lastError = error
            
            if (i === tokenFormats.length - 1) {
              throw lastError
            }
            console.log(`[v0] Trying next format...`)
          }
        }
      }

      console.log("[v0] ========== ALL NFTs SENT ==========")
      setStep("success")
    } catch (error: any) {
      console.error("[v0] ========== FATAL ERROR ==========")
      console.error("[v0] Error object:", error)
      console.error("[v0] Error message:", error?.message)
      console.error("[v0] Error stack:", error?.stack)
      const errorMsg = error?.message || "Unknown error"
      alert(`Error sending NFT: ${errorMsg}`)
      setIsSending(false)
      return
    }
    
    setIsSending(false)
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep("recipient")
      setRecipient("")
      setSelectedUser(null)
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
                          if (user.ethAddress) {
                            handleSelectRecipient(user.ethAddress, user)
                          }
                        }}
                        className="w-full text-left p-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          {user.pfpUrl && (
                            <img src={user.pfpUrl || "/placeholder.svg"} alt="" className="w-8 h-8 rounded-full" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{user.displayName}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                          {user.ethAddress && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {user.ethAddress.slice(0, 6)}...{user.ethAddress.slice(-4)}
                            </p>
                          )}
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

              {recipient && (
                <Button onClick={() => setStep("confirm")} className="w-full" disabled={isSending}>
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
                  {selectedUser ? (
                    <div className="flex items-center gap-2 mt-2">
                      {selectedUser.pfpUrl && (
                        <img src={selectedUser.pfpUrl || "/placeholder.svg"} alt="" className="w-8 h-8 rounded-full" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{selectedUser.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-mono font-medium">
                      {recipient.slice(0, 6)}...{recipient.slice(-4)}
                    </p>
                  )}
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
