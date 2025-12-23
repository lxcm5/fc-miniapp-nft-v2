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
  const { sdk, isSDKLoaded } = useFarcaster()

  const handleSend = async () => {
    if (!feedback.trim()) return

    setIsLoading(true)
    try {
      console.log("[v0] SDK ready?", isSDKLoaded)
      console.log("[v0] SDK instance?", !!sdk)
      console.log("[v0] SDK actions?", !!sdk?.actions)

      if (sdk?.actions?.cast) {
        const result = await sdk.actions.cast({
          text: `@partakon ${feedback}`,
        })
        console.log("[v0] Cast sent:", result)
        alert("Feedback sent successfully!")
        setFeedback("")
        onOpenChange(false)
      } else {
        console.error("[v0] SDK actions not available")
        alert("Unable to send feedback. Please ensure this is running in Farcaster context.")
      }
    } catch (error) {
      console.error("[v0] Error sending feedback:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
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
