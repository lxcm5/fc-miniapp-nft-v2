"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AboutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDonateClick: () => void
  onWhatsNewClick: () => void
}

export function AboutModal({ open, onOpenChange, onDonateClick, onWhatsNewClick }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>About</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-foreground">
            Created by{" "}
            <a
              href="https://warpcast.com/lxc5m"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              @lxc5m
            </a>
          </div>
          <div className="text-sm text-muted-foreground">Version v1.6</div>
          <Button variant="outline" size="sm" onClick={onWhatsNewClick} className="w-full text-primary bg-transparent">
            What's New
          </Button>
          <Button onClick={onDonateClick} className="w-full bg-primary hover:bg-primary/90">
            Donate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
