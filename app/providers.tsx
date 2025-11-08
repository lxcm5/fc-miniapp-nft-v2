"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import sdk, { type Context } from "@farcaster/frame-sdk"

interface FarcasterContextType {
  isSDKLoaded: boolean
  context: Context.FrameContext | null
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  context: null,
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [context, setContext] = useState<Context.FrameContext | null>(null)

  useEffect(() => {
    const load = async () => {
      const frameContext = await sdk.context
      setContext(frameContext)

      // Notify Farcaster that the app is ready
      sdk.actions.ready()
      setIsSDKLoaded(true)
    }

    load()
  }, [])

  return <FarcasterContext.Provider value={{ isSDKLoaded, context }}>{children}</FarcasterContext.Provider>
}
