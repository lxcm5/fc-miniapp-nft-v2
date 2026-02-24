"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { MiniKitProvider, useMiniKit } from "@coinbase/onchainkit/minikit"
import { base } from "wagmi/chains"
import { useAccount, useConnect } from "wagmi"
import farcasterSdk, { type Context } from "@farcaster/miniapp-sdk"

interface FarcasterContextType {
  isSDKLoaded: boolean
  context: Context.FrameContext | null
  walletAddress: string | null
  ethBalance: string | null
  connectWallet: () => Promise<void>
  isWalletConnected: boolean
  sdk: typeof farcasterSdk | null
  isInFarcaster: boolean
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  context: null,
  walletAddress: null,
  ethBalance: null,
  connectWallet: async () => {},
  isWalletConnected: false,
  sdk: null,
  isInFarcaster: false,
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

function FarcasterProviderInner({ children }: { children: ReactNode }) {
  const { setFrameReady, isFrameReady, context } = useMiniKit()
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount()
  const { connect, connectors } = useConnect()

  const [ethBalance, setEthBalance] = useState<string | null>(null)
  const [cachedAddress, setCachedAddress] = useState<string | null>(null)

  // Restore cached address from localStorage
  useEffect(() => {
    const savedAddress = localStorage.getItem("farcaster_wallet_address")
    const savedConnected = localStorage.getItem("farcaster_wallet_connected")
    console.log("[v0] Restored from localStorage:", { savedAddress, savedConnected })

    if (savedAddress && savedConnected === "true") {
      setCachedAddress(savedAddress)
      fetchBalance(savedAddress)
    }
  }, [])

  // Set frame ready on mount
  useEffect(() => {
    if (!isFrameReady) {
      console.log("[v0] Setting frame ready via MiniKit...")
      setFrameReady()
    }
  }, [setFrameReady, isFrameReady])

  // Extract address from MiniKit context (Farcaster user data)
  const contextAddress =
    (context as any)?.user?.verified_addresses?.eth_addresses?.[0] ||
    (context as any)?.user?.custody_address

  // Prefer wagmi address (works in both Farcaster and Base App),
  // fallback to context address, then cached address
  const walletAddress = wagmiAddress || contextAddress || cachedAddress || null
  const isWalletConnected = wagmiConnected || !!walletAddress
  const isInFarcaster = !!context

  // Log context for debugging
  useEffect(() => {
    if (context) {
      console.log("[v0] MiniKit context loaded:", !!context)
      console.log("[v0] Context user:", (context as any)?.user)
      console.log("[v0] isInFarcaster:", true)
    }
  }, [context])

  // Fetch balance and persist address when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      console.log("[v0] Wallet address resolved:", walletAddress)
      localStorage.setItem("farcaster_wallet_address", walletAddress)
      localStorage.setItem("farcaster_wallet_connected", "true")
      fetchBalance(walletAddress)
    }
  }, [walletAddress])

  const fetchBalance = async (address: string) => {
    try {
      console.log("[v0] Fetching balance for:", address)
      const response = await fetch("https://mainnet.base.org", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [address, "latest"],
          id: 1,
        }),
      })

      const data = await response.json()
      console.log("[v0] Balance response:", data)

      if (data.result) {
        const balanceInWei = BigInt(data.result)
        const balanceInEth = Number(balanceInWei) / 1e18
        setEthBalance(balanceInEth.toFixed(4))
        console.log("[v0] Balance set to:", balanceInEth.toFixed(4))
      }
    } catch (error) {
      console.error("[v0] Error fetching balance:", error)
      setEthBalance("0.0000")
    }
  }

  const connectWallet = async () => {
    try {
      console.log("[v0] Connect wallet called via wagmi")
      if (connectors.length > 0) {
        connect({ connector: connectors[0] })
      }
    } catch (error) {
      console.error("[v0] Error connecting wallet:", error)
    }
  }

  return (
    <FarcasterContext.Provider
      value={{
        isSDKLoaded: true,
        context: (context as Context.FrameContext) || null,
        walletAddress,
        ethBalance,
        connectWallet,
        isWalletConnected,
        sdk: farcasterSdk,
        isInFarcaster,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  )
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        appearance: {
          mode: "light" as const,
          theme: "default" as const,
          name: "NFT aWallet",
        },
      }}
    >
      <FarcasterProviderInner>{children}</FarcasterProviderInner>
    </MiniKitProvider>
  )
}
