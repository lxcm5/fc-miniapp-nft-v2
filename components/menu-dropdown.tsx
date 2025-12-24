"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { AboutModal } from "./modals/about-modal"
import { WhatsNewModal } from "./modals/whats-new-modal"
import { Menu } from "lucide-react"
import { useFarcaster } from "@/app/providers"

export function MenuDropdown() {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false)
  const { sdk, isInFarcaster } = useFarcaster()

  const handleCastFeedback = async () => {
    if (!sdk) return
    try {
      await sdk.actions.composeCast({
        text: "Just tried a new Farcaster app",
        embeds: ["https://miniapp-nft-v2.vercel.app/"],
      })
    } catch (error) {
      console.error("Error opening composer:", error)
    }
  }

  const handleDonate = async () => {
    if (!isInFarcaster) {
      alert("Open this app in Warpcast to donate.")
      return
    }

    const res = await sdk.actions.sendToken({
      recipientAddress: "0xdBB9f76DC289B4cec58BCfe10923084F96Fa6Aee",
      token: "eip155:8453/slip44:60",
    })

    console.log("[v0] sendToken:", res)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-transparent px-2">
            <Menu className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 py-2">
          <DropdownMenuItem onClick={() => setAboutOpen(true)} className="py-2.5 cursor-pointer hover:bg-muted">
            About
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCastFeedback} className="py-2.5 cursor-pointer hover:bg-muted">
            Cast Feedback
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDonate} className="py-2.5 cursor-pointer hover:bg-muted">
            Donate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AboutModal
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        onDonateClick={() => {
          setAboutOpen(false)
          handleDonate()
        }}
        onWhatsNewClick={() => {
          setAboutOpen(false)
          setWhatsNewOpen(true)
        }}
      />
      <WhatsNewModal open={whatsNewOpen} onOpenChange={setWhatsNewOpen} />
    </>
  )
}

export { MenuDropdown as Menu }
