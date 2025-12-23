"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useFarcaster } from "@/app/providers"

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { farcasterUser } = useFarcaster()

  const handleSend = async () => {
    if (!feedback.trim() || !farcasterUser) return

    setIsLoading(true)
    try {
      // Send feedback via Farcaster DM
      // This would require Farcaster Frame SDK integration for sending DMs
      console.log("Sending feedback:", feedback, "from:", farcasterUser.username)

      // For now, just close the modal after a brief delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      setFeedback("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error sending feedback:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <textarea
            placeholder="Tell us what you think..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full h-32 p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            onClick={handleSend}
            disabled={!feedback.trim() || isLoading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
