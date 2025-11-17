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

  useEffect(() => {
    if (isOpen) {
      console.log("[v0] ====== SendNFTModal OPENED ======")
      console.log("[v0] Modal isOpen:", isOpen)
      console.log("[v0] NFT IDs:", nftIds)
      console.log("[v0] NFT data:", nftData)
      console.log("[v0] SDK from context:", !!farcasterSdk)
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
  }, [isOpen, nftData, walletAddress, nftIds])

  const handleSelectRecipient = (address: string, user?: FarcasterUser) => {
    setRecipient(address)
    setSelectedUser(user || null)
    setSearchResults([])
    setStep("confirm")
  }

  const handleSend = async () => {
    console.log("[v0] ====== handleSend CALLED ======")
    
    setIsSending(true)

    try {
      let normalizedRecipient = recipient.toLowerCase()
      
      if (!normalizedRecipient.startsWith("0x")) {
        console.error("[v0] ERROR: Recipient is not an address:", recipient)
        alert("Please select a user from the list or enter a valid 0x address")
        setIsSending(false)
        return
      }

      const activeSdk = farcasterSdk
      
      console.log("[v0] Using SDK:", activeSdk)
      console.log("[v0] SDK has sendTransaction:", !!activeSdk?.actions?.sendTransaction)

      if (!activeSdk?.actions?.sendTransaction) {
        console.error("[v0] ERROR: sendTransaction not available on SDK")
        console.error("[v0] Available SDK methods:", Object.keys(activeSdk?.actions || {}))
        alert("Mini app must be opened in Warpcast with connected wallet.")
        setIsSending(false)
        return
      }

      if (!walletAddress) {
        console.error("[v0] ERROR: Wallet address not available")
        alert("Wallet not connected")
        setIsSending(false)
        return
      }

      console.log("[v0] Processing", nftData?.length || 0, "NFTs")

      for (const nft of nftData || []) {
        console.log("[v0] ====== Processing NFT ======")
        
        const contractAddress = nft.contractAddress || nft.contract?.address || nft.contract_address
        const rawTokenId = nft.tokenId || nft.token_id || nft.id?.tokenId
        
        console.log("[v0] Contract address:", contractAddress)
        console.log("[v0] Raw token ID:", rawTokenId)
        
        if (!contractAddress || !rawTokenId) {
          console.error("[v0] ERROR: Missing contract or tokenId")
          throw new Error("Missing contract address or token ID")
        }

        // Convert tokenId to hex format for encoding
        let tokenIdHex: string
        if (typeof rawTokenId === "string" && rawTokenId.startsWith("0x")) {
          tokenIdHex = rawTokenId
        } else {
          tokenIdHex = "0x" + BigInt(rawTokenId).toString(16)
        }

        console.log("[v0] Token ID hex:", tokenIdHex)
        console.log("[v0] From:", walletAddress)
        console.log("[v0] To:", normalizedRecipient)

        // Encode safeTransferFrom(address from, address to, uint256 tokenId)
        // Function selector: 0x42842e0e
        const functionSelector = "0x42842e0e"
        
        // Pad addresses to 32 bytes (64 hex chars)
        const fromPadded = walletAddress.slice(2).padStart(64, '0')
        const toPadded = normalizedRecipient.slice(2).padStart(64, '0')
        const tokenIdPadded = tokenIdHex.slice(2).padStart(64, '0')
        
        const encodedData = functionSelector + fromPadded + toPadded + tokenIdPadded
        
        console.log("[v0] ====== Encoded transaction data ======")
        console.log("[v0] Function selector:", functionSelector)
        console.log("[v0] From (padded):", fromPadded)
        console.log("[v0] To (padded):", toPadded)
        console.log("[v0] TokenId (padded):", tokenIdPadded)
        console.log("[v0] Full encoded data:", encodedData)

        console.log("[v0] ====== Sending transaction via SDK ======")
        
        try {
          const result = await activeSdk.actions.sendTransaction({
            chainId: "eip155:8453",
            to: contractAddress,
            data: encodedData,
            value: "0"
          })

          console.log("[v0] Transaction result:", result)
          console.log("[v0] Transaction hash:", result?.transactionHash)

          if (!result.transactionHash) {
            console.error("[v0] No transaction hash returned")
            throw new Error("Transaction failed - no hash returned")
          }
          
          console.log("[v0] ✅ NFT sent successfully!")
          console.log("[v0] View on Basescan: https://basescan.org/tx/" + result.transactionHash)
        } catch (txError: any) {
          console.error("[v0] sendTransaction threw exception:", txError)
          console.error("[v0] Error message:", txError?.message)
          throw txError
        }
      }

      console.log("[v0] ====== All NFTs sent successfully ======")
      setStep("success")
    } catch (error: any) {
      console.error("[v0] ====== ERROR in handleSend ======")
      console.error("[v0] Error:", error)
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
                <Button 
                  onClick={() => {
                    console.log("[v0] Send button CLICKED in confirm step")
                    console.log("[v0] About to call handleSend...")
                    handleSend()
                  }} 
                  className="bg-primary" 
                  disabled={isSending}
                >
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
