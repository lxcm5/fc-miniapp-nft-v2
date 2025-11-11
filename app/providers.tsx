"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import sdk, { type Context } from "@farcaster/frame-sdk"

interface FarcasterContextType {
  isSDKLoaded: boolean
  context: Context.FrameContext | null
  walletAddress: string | null
  ethBalance: string | null
  connectWallet: () => Promise<void>
  isWalletConnected: boolean
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  context: null,
  walletAddress: null,
  ethBalance: null,
  connectWallet: async () => {},
  isWalletConnected: false,
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
    const load = async () => {
      const frameContext = await sdk.context
      setContext(frameContext)

      // Get wallet address from Farcaster context
      const address = frameContext?.user?.custody_address || frameContext?.user?.verified_addresses?.eth_addresses?.[0]

      if (address) {
        setWalletAddress(address)
        setIsWalletConnected(true)
        // Fetch ETH balance
        await fetchBalance(address)
      }

      // Notify Farcaster that the app is ready
      sdk.actions.ready()
      setIsSDKLoaded(true)
    }

    load()
  }, [])

  const fetchBalance = async (address: string) => {
    try {
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
      if (data.result) {
        // Convert from Wei to ETH
        const balanceInWei = BigInt(data.result)
        const balanceInEth = Number(balanceInWei) / 1e18
        setEthBalance(balanceInEth.toFixed(4))
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
      setEthBalance("0.0000")
    }
  }

  const connectWallet = async () => {
    try {
      // Request wallet access from Farcaster
      const result = await sdk.wallet.ethProvider.request({
        method: "eth_requestAccounts",
      })

      if (result && Array.isArray(result) && result.length > 0) {
        const address = result[0]
        setWalletAddress(address)
        setIsWalletConnected(true)
        await fetchBalance(address)
      } else {
        // Fallback to context addresses
        const address = context?.user?.custody_address || context?.user?.verified_addresses?.eth_addresses?.[0]
        if (address) {
          setWalletAddress(address)
          setIsWalletConnected(true)
          await fetchBalance(address)
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      // Try fallback method
      const address = context?.user?.custody_address || context?.user?.verified_addresses?.eth_addresses?.[0]
      if (address) {
        setWalletAddress(address)
        setIsWalletConnected(true)
        await fetchBalance(address)
      }
    }
  }

  return (
    <FarcasterContext.Provider
      value={{ isSDKLoaded, context, walletAddress, ethBalance, connectWallet, isWalletConnected }}
    >
      {children}
    </FarcasterContext.Provider>
  )
}
