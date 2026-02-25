"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { AboutModal } from "./modals/about-modal"
import { WhatsNewModal } from "./modals/whats-new-modal"
import { DonateModal } from "./modals/donate-modal"
import { ViewWalletModal } from "./view-wallet-modal"
import { Menu, Search } from "lucide-react"
import { useFarcaster } from "@/app/providers"

interface MenuDropdownProps {
  onViewWallet?: (address: string, username?: string) => void
}

export function MenuDropdown({ onViewWallet }: MenuDropdownProps) {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false)
  const [donateOpen, setDonateOpen] = useState(false)
  const [viewWalletOpen, setViewWalletOpen] = useState(false)
  const { sdk } = useFarcaster()

  const handleCastFeedback = async () => {
    if (!sdk) return
    try {
      await sdk.actions.composeCast({
        text: "Just tried a new Farcaster app",
        embeds: ["https://nft-awallet.vercel.app/"],
      })
    } catch (error) {
      console.error("Error opening composer:", error)
    }
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
          <DropdownMenuItem onClick={() => setViewWalletOpen(true)} className="py-2.5 cursor-pointer hover:bg-muted">
            <Search className="w-4 h-4 mr-2" />
            View Wallet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAboutOpen(true)} className="py-2.5 cursor-pointer hover:bg-muted">
            About
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCastFeedback} className="py-2.5 cursor-pointer hover:bg-muted">
            Cast Feedback
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDonateOpen(true)} className="py-2.5 cursor-pointer hover:bg-muted">
            Donate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewWalletModal
        open={viewWalletOpen}
        onOpenChange={setViewWalletOpen}
        onViewWallet={(address, username) => {
          onViewWallet?.(address, username)
        }}
      />
      <AboutModal
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        onDonateClick={() => {
          setAboutOpen(false)
          setDonateOpen(true)
        }}
        onWhatsNewClick={() => {
          setAboutOpen(false)
          setWhatsNewOpen(true)
        }}
      />
      <WhatsNewModal open={whatsNewOpen} onOpenChange={setWhatsNewOpen} />
      <DonateModal open={donateOpen} onOpenChange={setDonateOpen} />
    </>
  )
}

export { MenuDropdown as Menu }
