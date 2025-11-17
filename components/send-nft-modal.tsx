"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useFarcaster } from "@/app/providers"
import farcasterSdk from "@farcaster/miniapp-sdk"

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
  const { walletAddress, sdk } = useFarcaster()

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

  useEffect(() => {
    if (isOpen) {
      console.log("[v0] ====== SendNFTModal OPENED ======")
      console.log("[v0] Modal isOpen:", isOpen)
      console.log("[v0] NFT IDs:", nftIds)
      console.log("[v0] NFT data:", nftData)
      console.log("[v0] SDK from context:", !!sdk)
      console.log("[v0] Wallet address:", walletAddress)
      
      if (nftData && nftData.length > 0) {
        nftData.forEach((nft, index) => {
          console.log(`[v0] NFT ${index}:`, {
            contractAddress: nft.contractAddress || nft.contract?.address,
            tokenId: nft.tokenId || nft.token_id,
            fullObject: nft
          })
        })
      }
    }
  }, [isOpen, nftData, sdk, walletAddress, nftIds])

  const handleSelectRecipient = (address: string, user?: FarcasterUser) => {
    setRecipient(address)
    setSelectedUser(user || null)
    setSearchResults([])
    setStep("confirm")
  }

  const handleSend = async () => {
    console.log("[v0] ====== handleSend CALLED ======")
    console.log("[v0] Button clicked, starting send process...")
    console.log("[v0] ====== handleSend START ======")
    console.log("[v0] SDK available:", !!sdk)
    console.log("[v0] SDK object:", sdk)
    console.log("[v0] sendToken function:", !!sdk?.actions?.sendToken)
    console.log("[v0] Recipient value:", recipient)
    console.log("[v0] Recipient type:", typeof recipient)
    console.log("[v0] Is recipient address:", recipient.startsWith("0x"))
    console.log("[v0] Selected user:", selectedUser)
    console.log("[v0] NFT data:", nftData)
    
    setIsSending(true)

    try {
      let normalizedRecipient = recipient.toLowerCase()
      
      if (!normalizedRecipient.startsWith("0x")) {
        console.error("[v0] ERROR: Recipient is not an address:", recipient)
        alert("Please select a user from the list or enter a valid 0x address")
        setIsSending(false)
        return
      }

      if (!sdk?.actions?.sendToken) {
        console.error("[v0] ERROR: sendToken not available on SDK")
        console.log("[v0] Attempting fallback to direct transaction...")
        alert("Mini app must be opened in Warpcast with connected wallet.")
        setIsSending(false)
        return
      }

      console.log("[v0] Processing", nftData?.length || 0, "NFTs")

      for (const nft of nftData || []) {
        console.log("[v0] ====== Processing NFT ======")
        console.log("[v0] Full NFT object:", JSON.stringify(nft, null, 2))
        
        const contractAddress = nft.contractAddress || nft.contract?.address || nft.contract_address
        const rawTokenId = nft.tokenId || nft.token_id || nft.id?.tokenId
        
        console.log("[v0] Contract address (direct):", nft.contractAddress)
        console.log("[v0] Contract address (nested):", nft.contract?.address)
        console.log("[v0] Token ID (direct):", nft.tokenId)
        console.log("[v0] Final contract:", contractAddress)
        console.log("[v0] Final tokenId:", rawTokenId)
        
        console.log("[v0] Contract address:", contractAddress)
        console.log("[v0] Contract type:", typeof contractAddress)
        console.log("[v0] Raw token ID:", rawTokenId)
        console.log("[v0] Token ID type:", typeof rawTokenId)
        
        if (!contractAddress || !rawTokenId) {
          console.error("[v0] ERROR: Missing data")
          console.error("[v0] - Contract:", contractAddress)
          console.error("[v0] - TokenId:", rawTokenId)
          throw new Error("Missing contract address or token ID")
        }

        let numericTokenId: string
        if (typeof rawTokenId === "string" && rawTokenId.startsWith("0x")) {
          console.log("[v0] Converting hex tokenId to decimal")
          numericTokenId = BigInt(rawTokenId).toString()
        } else {
          numericTokenId = rawTokenId.toString()
        }

        console.log("[v0] Numeric token ID:", numericTokenId)

        const normalizedContract = contractAddress.toLowerCase()
        
        const tokenCAIP_slashes = `eip155:8453/erc721:${normalizedContract}/${numericTokenId}`
        const tokenCAIP_colons = `eip155:8453:erc721:${normalizedContract}:${numericTokenId}`
        
        console.log("[v0] ====== SENDING NFT ======")
        console.log("[v0] Token CAIP-19 (slashes):", tokenCAIP_slashes)
        console.log("[v0] Token CAIP-19 (colons):", tokenCAIP_colons)
        console.log("[v0] Recipient:", normalizedRecipient)
        console.log("[v0] Chain ID: 8453 (Base mainnet)")
        console.log("[v0] Amount: 1")
        console.log("[v0] Calling sdk.actions.sendToken with slashes format...")
        
        try {
          const result = await sdk.actions.sendToken({
            token: tokenCAIP_slashes,
            amount: "1",
            recipientAddress: normalizedRecipient
          })

          console.log("[v0] Send result:", result)
          console.log("[v0] Result success:", result?.success)

          if (!result.success) {
            console.error("[v0] Send failed with slashes, trying colons format...")
            
            const result2 = await sdk.actions.sendToken({
              token: tokenCAIP_colons,
              amount: "1",
              recipientAddress: normalizedRecipient
            })
            
            console.log("[v0] Send result (colons):", result2)
            
            if (!result2.success) {
              console.error("[v0] Both formats failed")
              throw new Error(result2.error?.message || "Failed to send NFT")
            }
          }
        } catch (sendError: any) {
          console.error("[v0] sendToken threw exception:", sendError)
          console.error("[v0] Error message:", sendError?.message)
          console.error("[v0] Error stack:", sendError?.stack)
          throw sendError
        }
      }

      console.log("[v0] ====== All NFTs sent successfully ======")
      setStep("success")
    } catch (error: any) {
      console.error("[v0] ====== ERROR in handleSend ======")
      console.error("[v0] Error object:", error)
      console.error("[v0] Error message:", error?.message)
      console.error("[v0] Error stack:", error?.stack)
      alert(`Error sending NFT: ${error?.message || "Unknown error"}`)
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
