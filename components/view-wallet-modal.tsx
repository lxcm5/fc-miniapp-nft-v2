"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  ethAddress?: string
}

interface ViewWalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewWallet: (address: string, username?: string) => void
}

function getPreferredAddress(user: any): string | undefined {
  const ethAddresses = user?.verified_addresses?.eth_addresses
  if (ethAddresses && Array.isArray(ethAddresses) && ethAddresses.length > 0) {
    return ethAddresses[0]
  }
  return user?.custody_address
}

export function ViewWalletModal({ open, onOpenChange, onViewWallet }: ViewWalletModalProps) {
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<FarcasterUser[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setQuery("")
        setSearchResults([])
        setIsSearching(false)
      }, 300)
    }
  }, [open])

  // Debounced search — 300ms for both address and username
  useEffect(() => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      try {
        if (query.startsWith("0x")) {
          // Address search via Farcaster search proxy
          const response = await fetch(
            `/api/farcaster-search?address=${encodeURIComponent(query)}`,
          )
          const data = await response.json()

          if (data && Object.keys(data).length > 0) {
            const users = Object.values(data)
              .flat()
              .map((user: any) => ({
                fid: user.fid,
                username: user.username,
                displayName: user.display_name || user.username,
                pfpUrl: user.pfp_url,
                ethAddress: getPreferredAddress(user) || query,
              }))
            setSearchResults(users)
          } else {
            // No Farcaster user found — still allow viewing the address directly
            setSearchResults([
              {
                fid: 0,
                username: "",
                displayName: `${query.slice(0, 6)}...${query.slice(-4)}`,
                ethAddress: query,
              },
            ])
          }
        } else {
          // Username search via Farcaster search proxy
          const response = await fetch(
            `/api/farcaster-search?q=${encodeURIComponent(query)}`,
          )
          const data = await response.json()

          if (data.result?.users && data.result.users.length > 0) {
            const users = data.result.users
              .map((user: any) => ({
                fid: user.fid,
                username: user.username,
                displayName: user.display_name || user.username,
                pfpUrl: user.pfp_url,
                ethAddress: getPreferredAddress(user),
              }))
              .filter((u: FarcasterUser) => u.ethAddress)
            setSearchResults(users)
          } else {
            setSearchResults([])
          }
        }
      } catch (error) {
        console.error("[v0] ViewWalletModal search error:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleView = (user: FarcasterUser) => {
    if (!user.ethAddress) return
    onViewWallet(user.ethAddress, user.username || undefined)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Address or username</label>
            <Input
              placeholder="0x address or username"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {isSearching && (
            <div className="text-sm text-muted-foreground">Searching...</div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              {searchResults.map((user, index) => (
                <div
                  key={user.fid || index}
                  className="flex items-center gap-3 p-3 border-b border-border last:border-b-0"
                >
                  {user.pfpUrl && (
                    <img
                      src={user.pfpUrl}
                      alt=""
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    {user.username && (
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    )}
                    {user.ethAddress && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {user.ethAddress.slice(0, 6)}...{user.ethAddress.slice(-4)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleView(user)}
                    disabled={!user.ethAddress}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!isSearching && query.length >= 2 && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
