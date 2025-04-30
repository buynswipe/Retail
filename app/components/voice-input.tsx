"use client"

import { useState, useEffect } from "react"
import { Mic, StopCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVoiceInputField } from "@/hooks/use-voice-input-field"
import { useTranslation } from "./translation-provider"

interface VoiceInputProps {
  onTranscript: (text: string) => void
  language?: string
  className?: string
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  buttonSize?: "default" | "sm" | "lg" | "icon"
  disabled?: boolean
}

export function VoiceInput({
  onTranscript,
  language,
  className = "",
  buttonVariant = "outline",
  buttonSize = "icon",
  disabled = false,
}: VoiceInputProps) {
  const { t } = useTranslation()
  const [showTooltip, setShowTooltip] = useState(false)

  const { isListening, transcript, error, startListening, stopListening, isSupported } = useVoiceInputField({
    language,
    continuous: false,
    interimResults: true,
    onResult: (text) => {
      onTranscript(text)
    },
  })

  useEffect(() => {
    if (error) {
      console.error("Voice input error:", error)
    }
  }, [error])

  const handleToggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        disabled={disabled}
        onClick={handleToggleListening}
        className={`relative ${isListening ? "animate-pulse bg-red-100" : ""}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={isListening ? t("stop.voice.input") : t("start.voice.input")}
      >
        {isListening ? <StopCircle className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
      </Button>

      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
          {isListening ? t("stop.voice.input") : t("start.voice.input")}
        </div>
      )}

      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-red-500 text-white text-xs rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  )
}
