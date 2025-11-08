import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { FarcasterProvider } from "./providers"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Farcaster NFT Wallet",
  description: "View your ETH balance and NFT collection",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Farcaster NFT Wallet",
    description: "View your ETH balance and NFT collection",
    images: ["/colorful-abstract-ape-art.jpg"],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://fc-miniapp-nft-v2.vercel.app/colorful-abstract-ape-art.jpg",
    "fc:frame:button:1": "Open App",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://fc-miniapp-nft-v2.vercel.app",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <FarcasterProvider>{children}</FarcasterProvider>
        <Analytics />
      </body>
    </html>
  )
}
