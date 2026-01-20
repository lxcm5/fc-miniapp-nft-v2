import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { FarcasterProvider } from "./providers"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const APP_URL = "https://nft-awallet.vercel.app"

const miniAppEmbed = {
  version: "1",
  imageUrl: `${APP_URL}/embed2.png`,
  button: {
    title: "Open Wallet",
    action: {
      type: "launch_miniapp",
      name: "NFT aWallet",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/icon.png`,
      splashBackgroundColor: "#ffffff",
    },
  },
}

export const metadata: Metadata = {
  title: "Farcaster NFT Wallet",
  description: "View your ETH balance and NFT collection",
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/icon.png",
      },
    ],
  },
  openGraph: {
    title: "Farcaster NFT Wallet",
    description: "View your NFTs",
    images: [`${APP_URL}/embed2.png`],
  },
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    "base:app_id": "6968c5f04991800a6d9d649d",
  },
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <FarcasterProvider>{children}</FarcasterProvider>
        <Analytics />
      </body>
    </html>
  )
}
