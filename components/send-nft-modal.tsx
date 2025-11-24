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
  const [recentRecipients, setRecentRecipients] = useState<FarcasterUser[]>([])
  const { walletAddress } = useFarcaster()

  const myVerifiedAddresses = [walletAddress].filter(Boolean)

  useEffect(() => {
    const loadRecents = () => {
      try {
        const stored = localStorage.getItem("recentNFTRecipients")
        if (stored) {
          const recents = JSON.parse(stored)
          setRecentRecipients(recents)
        }
      } catch (error) {
        console.error("Error loading recent recipients:", error)
      }
    }

    if (isOpen) {
      loadRecents()
    }
  }, [isOpen])

  useEffect(() => {
    const searchUsers = async () => {
      if (recipient.length < 2) {
        setSearchResults([])
        return
      }

      if (recipient.startsWith("0x") && recipient.length > 10) {
        setIsSearching(true)

        try {
          const response = await fetch(
            `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${recipient}`,
            {
              headers: {
                accept: "application/json",
                api_key: "NEYNAR_API_DOCS",
              },
            },
          )

          const data = await response.json()

          if (data && Object.keys(data).length > 0) {
            const users = Object.values(data)
              .flat()
              .map((user: any) => {
                console.log("[v0] User data for address search:", user)
                const ethAddress = getPreferredBaseAddress(user)

                return {
                  fid: user.fid,
                  username: user.username,
                  displayName: user.display_name || user.username,
                  pfpUrl: user.pfp_url,
                  ethAddress: ethAddress,
                }
              })

            setSearchResults(users)
          } else {
            setSearchResults([])
          }
        } catch (error) {
          console.error("Error searching by address:", error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
        return
      }

      setIsSearching(true)

      try {
        const response = await fetch(
          `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(recipient)}&limit=5`,
          {
            headers: {
              accept: "application/json",
              api_key: "NEYNAR_API_DOCS",
            },
          },
        )

        const data = await response.json()

        if (data.result?.users && data.result.users.length > 0) {
          const users = data.result.users
            .map((user: any) => {
              console.log("[v0] User search result:", user)
              console.log("[v0] Verified addresses:", user.verified_addresses)
              const ethAddress = getPreferredBaseAddress(user)
              console.log("[v0] Selected address:", ethAddress)

              return {
                fid: user.fid,
                username: user.username,
                displayName: user.display_name || user.username,
                pfpUrl: user.pfp_url,
                ethAddress: ethAddress,
              }
            })
            .filter((u: FarcasterUser) => u.ethAddress)

          setSearchResults(users)
        } else {
          setSearchResults([])
        }
      } catch (error) {
        console.error("Error searching Farcaster users:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(searchUsers, 300)
    return () => clearTimeout(timeoutId)
  }, [recipient])

  useEffect(() => {
    if (!isOpen) return
  }, [isOpen])

  const handleSelectRecipient = (address: string, user?: FarcasterUser) => {
    setRecipient(address)
    setSelectedUser(user || null)
    setSearchResults([])
    setStep("confirm")
  }

  const handleSend = async () => {
    setIsSending(true)

    try {
      const provider = farcasterSdk.wallet.ethProvider

      if (!provider) {
        throw new Error("Ethereum provider not available. Please open this app in Warpcast.")
      }

      const normalizedRecipient = recipient.toLowerCase()

      if (!normalizedRecipient.startsWith("0x")) {
        throw new Error("Invalid recipient address")
      }

      if (!walletAddress) {
        throw new Error("Wallet not connected")
      }

      for (const nft of nftData || []) {
        const contractAddress = nft.contractAddress || nft.contract?.address || nft.contract_address
        const rawTokenId = nft.tokenId || nft.token_id || nft.id?.tokenId

        if (!contractAddress || !rawTokenId) {
          throw new Error("Missing contract address or token ID")
        }

        let tokenIdHex: string
        if (typeof rawTokenId === "string" && rawTokenId.startsWith("0x")) {
          tokenIdHex = rawTokenId
        } else {
          tokenIdHex = "0x" + BigInt(rawTokenId).toString(16)
        }

        const functionSelector = "0x42842e0e"
        const fromPadded = walletAddress.slice(2).padStart(64, "0")
        const toPadded = normalizedRecipient.slice(2).padStart(64, "0")
        const tokenIdPadded = tokenIdHex.slice(2).padStart(64, "0")
        const encodedData = functionSelector + fromPadded + toPadded + tokenIdPadded

        const txParams = {
          from: walletAddress,
          to: contractAddress,
          data: encodedData,
          value: "0x0",
        }

        const txHash = await provider.request({
          method: "eth_sendTransaction",
          params: [txParams],
        })

        if (!txHash) {
          throw new Error("Transaction failed - no hash returned")
        }
      }

      saveRecentRecipient(recipient, selectedUser || undefined)

      setStep("success")
    } catch (error: any) {
      console.error("Error sending NFT:", error)
      alert(`Error sending NFT: ${error?.message || "Unknown error"}`)
    } finally {
      setIsSending(false)
    }
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

  const saveRecentRecipient = (address: string, user?: FarcasterUser) => {
    try {
      const stored = localStorage.getItem("recentNFTRecipients")
      let recents: FarcasterUser[] = stored ? JSON.parse(stored) : []

      const newRecipient: FarcasterUser = user || {
        fid: 0,
        username: "",
        displayName: address,
        ethAddress: address,
      }

      recents = recents.filter((r) => r.ethAddress !== address)
      recents.unshift(newRecipient)
      recents = recents.slice(0, 4)

      localStorage.setItem("recentNFTRecipients", JSON.stringify(recents))
      setRecentRecipients(recents)
    } catch (error) {
      console.error("Error saving recent recipient:", error)
    }
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
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Farcaster Wallet</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {user.ethAddress.slice(0, 6)}...{user.ethAddress.slice(-4)}
                              </p>
                            </div>
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
                {recentRecipients.length > 0 ? (
                  <div className="space-y-2">
                    {recentRecipients.map((user, index) => (
                      <button
                        key={user.ethAddress || index}
                        onClick={() => handleSelectRecipient(user.ethAddress || "", user)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {user.pfpUrl && (
                            <img src={user.pfpUrl || "/placeholder.svg"} alt="" className="w-6 h-6 rounded-full" />
                          )}
                          <div className="flex-1">
                            {user.username ? (
                              <>
                                <p className="text-sm font-medium">{user.displayName}</p>
                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                              </>
                            ) : (
                              <p className="text-sm font-mono">
                                {user.ethAddress?.slice(0, 6)}...{user.ethAddress?.slice(-4)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent recipients</p>
                )}
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
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="text-xl">✅</div>
                  <p className="text-lg font-medium">Send complete</p>
                </div>
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

function getPreferredBaseAddress(user: any): string | undefined {
  console.log("[v0] === getPreferredBaseAddress START ===")
  console.log("[v0] User custody_address:", user?.custody_address)
  console.log("[v0] User verified_addresses:", JSON.stringify(user?.verified_addresses, null, 2))

  // custody_address is a technical Optimism address, not the wallet user wants to use
  const ethAddresses = user?.verified_addresses?.eth_addresses

  if (ethAddresses && Array.isArray(ethAddresses) && ethAddresses.length > 0) {
    // Take the FIRST verified address which should be the Farcaster Wallet
    const address = ethAddresses[0]
    console.log("[v0] Using verified address[0]:", address)
    console.log("[v0] === getPreferredBaseAddress END ===")
    return address
  }

  // Fallback to custody address only if no verified addresses
  console.log("[v0] No verified addresses found, using custody_address as fallback")
  console.log("[v0] === getPreferredBaseAddress END ===")
  return user?.custody_address
}
