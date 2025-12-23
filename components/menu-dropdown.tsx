"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { AboutModal } from "./modals/about-modal"
import { FeedbackModal } from "./modals/feedback-modal"
import { WhatsNewModal } from "./modals/whats-new-modal"
import { DonateModal } from "./modals/donate-modal"
import { Menu } from "lucide-react"

export function MenuDropdown() {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false)
  const [donateOpen, setDonateOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-transparent px-2">
            <Menu className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setAboutOpen(true)}>About</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setFeedbackOpen(true)}>Feedback</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setWhatsNewOpen(true)}>What's New</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDonateOpen(true)}>Donate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <WhatsNewModal open={whatsNewOpen} onOpenChange={setWhatsNewOpen} />
      <DonateModal open={donateOpen} onOpenChange={setDonateOpen} />
    </>
  )
}

export { MenuDropdown as Menu }
