"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import farcasterSdk, { type Context } from "@farcaster/miniapp-sdk"

interface FarcasterContextType {
  isSDKLoaded: boolean
  context: Context.FrameContext | null
  walletAddress: string | null
  ethBalance: string | null
  sdk: typeof farcasterSdk | null
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  context: null,
  walletAddress: null,
  ethBalance: null,
  sdk: null,
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [context, setContext] = useState<Context.FrameContext | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [ethBalance, setEthBalance] = useState<string | null>(null)
  const [sdkInstance, setSdkInstance] = useState<typeof farcasterSdk | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setSdkInstance(farcasterSdk)
        farcasterSdk.actions.ready()
        setIsSDKLoaded(true)

        // Get frame context for user data
        try {
          const frameContext = await farcasterSdk.context
          setContext(frameContext)

          const address =
            frameContext?.user?.custody_address || frameContext?.user?.verified_addresses?.eth_addresses?.[0]

          if (address) {
            setWalletAddress(address)
            await fetchBalance(address)
          }
        } catch (contextError) {
          console.log("[v0] Context not available (might be in browser)")
        }
      } catch (error) {
        console.error("[v0] Error loading SDK:", error)
        setSdkInstance(farcasterSdk)
        farcasterSdk.actions.ready()
        setIsSDKLoaded(true)
      }
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
        const balanceInWei = BigInt(data.result)
        const balanceInEth = Number(balanceInWei) / 1e18
        setEthBalance(balanceInEth.toFixed(4))
      }
    } catch (error) {
      console.error("[v0] Error fetching balance:", error)
      setEthBalance("0.0000")
    }
  }

  return (
    <FarcasterContext.Provider
      value={{
        isSDKLoaded,
        context,
        walletAddress,
        ethBalance,
        sdk: sdkInstance || farcasterSdk,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  )
}
