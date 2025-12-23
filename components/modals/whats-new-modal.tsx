"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CHANGELOG } from "@/data/changelog"

interface WhatsNewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsNewModal({ open, onOpenChange }: WhatsNewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>What's New</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {CHANGELOG.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No changes yet</p>
          ) : (
            CHANGELOG.map((change, index) => (
              <div key={index} className="border-l-2 border-primary pl-4 pb-4">
                <p className="text-sm font-semibold text-foreground">{change.version}</p>
                <p className="text-xs text-muted-foreground">{change.date}</p>
                <ul className="mt-2 space-y-1">
                  {change.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-foreground">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
