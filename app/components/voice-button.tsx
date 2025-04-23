"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"

interface VoiceButtonProps {
  onText: (text: string) => void
  language: "en" | "hi"
}

export default function VoiceButton({ onText, language }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false)

  const startListening = () => {
    setIsListening(true)

    // Check if browser supports speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.lang = language === "en" ? "en-IN" : "hi-IN"
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        onText(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } else {
      alert("Voice input is not supported in your browser.")
      setIsListening(false)
    }
  }

  return (
    <Button
      type="button"
      size="icon"
      variant={isListening ? "default" : "outline"}
      className={`h-12 w-12 rounded-full ${isListening ? "bg-orange-500 hover:bg-orange-600" : ""}`}
      onClick={startListening}
      aria-label="Voice input"
    >
      <Mic className={`h-6 w-6 ${isListening ? "animate-pulse" : ""}`} />
    </Button>
  )
}
