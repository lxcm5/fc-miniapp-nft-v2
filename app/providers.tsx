"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import farcasterSdk, { type Context } from "@farcaster/miniapp-sdk"

interface FarcasterContextType {
  isSDKLoaded: boolean
  context: Context.FrameContext | null
  walletAddress: string | null
  ethBalance: string | null
  connectWallet: () => Promise<void>
  isWalletConnected: boolean
  sdk: typeof farcasterSdk
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  context: null,
  walletAddress: null,
  ethBalance: null,
  connectWallet: async () => {},
  isWalletConnected: false,
  sdk: farcasterSdk,
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [context, setContext] = useState<Context.FrameContext | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [ethBalance, setEthBalance] = useState<string | null>(null)
  const [isWalletConnected, setIsWalletConnected] = useState(false)

  useEffect(() => {
    const savedAddress = localStorage.getItem("farcaster_wallet_address")
    const savedConnected = localStorage.getItem("farcaster_wallet_connected")

    console.log("[v0] Restored from localStorage:", { savedAddress, savedConnected })

    if (savedAddress && savedConnected === "true") {
      setWalletAddress(savedAddress)
      setIsWalletConnected(true)
      fetchBalance(savedAddress)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        console.log("[v0] Initializing Farcaster SDK...")

        farcasterSdk.actions.ready()
        setIsSDKLoaded(true)
        console.log("[v0] SDK ready called immediately")

        try {
          const frameContext = await farcasterSdk.context
          console.log("[v0] Frame context loaded:", frameContext)
          setContext(frameContext)

          console.log("[v0] User object:", frameContext?.user)
          console.log("[v0] Custody address:", frameContext?.user?.custody_address)
          console.log("[v0] Verified addresses:", frameContext?.user?.verified_addresses)

          const address =
            frameContext?.user?.custody_address || frameContext?.user?.verified_addresses?.eth_addresses?.[0]
          console.log("[v0] Final wallet address extracted:", address)

          if (address) {
            setWalletAddress(address)
            setIsWalletConnected(true)
            localStorage.setItem("farcaster_wallet_address", address)
            localStorage.setItem("farcaster_wallet_connected", "true")
            console.log("[v0] Wallet connected and saved, fetching balance...")
            await fetchBalance(address)
          } else {
            console.log("[v0] No address found in context")
          }
        } catch (contextError) {
          console.log("[v0] Context not available (might be in browser):", contextError)
        }
      } catch (error) {
        console.error("[v0] Error loading SDK:", error)
        farcasterSdk.actions.ready()
        setIsSDKLoaded(true)
      }
    }

    load()
  }, [])

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
      console.log("[v0] Connect wallet called")
      const result = await farcasterSdk.wallet.ethProvider.request({
        method: "eth_requestAccounts",
      })

      console.log("[v0] eth_requestAccounts result:", result)

      if (result && Array.isArray(result) && result.length > 0) {
        const address = result[0]
        setWalletAddress(address)
        setIsWalletConnected(true)
        localStorage.setItem("farcaster_wallet_address", address)
        localStorage.setItem("farcaster_wallet_connected", "true")
        await fetchBalance(address)
      } else {
        const address = context?.user?.custody_address || context?.user?.verified_addresses?.eth_addresses?.[0]
        if (address) {
          setWalletAddress(address)
          setIsWalletConnected(true)
          localStorage.setItem("farcaster_wallet_address", address)
          localStorage.setItem("farcaster_wallet_connected", "true")
          await fetchBalance(address)
        }
      }
    } catch (error) {
      console.error("[v0] Error connecting wallet:", error)
      const address = context?.user?.custody_address || context?.user?.verified_addresses?.eth_addresses?.[0]
      if (address) {
        setWalletAddress(address)
        setIsWalletConnected(true)
        localStorage.setItem("farcaster_wallet_address", address)
        localStorage.setItem("farcaster_wallet_connected", "true")
        await fetchBalance(address)
      }
    }
  }

  return (
    <FarcasterContext.Provider
      value={{ isSDKLoaded, context, walletAddress, ethBalance, connectWallet, isWalletConnected, sdk: farcasterSdk }}
    >
      {children}
    </FarcasterContext.Provider>
  )
}
