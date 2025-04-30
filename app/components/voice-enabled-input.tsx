"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, AlertCircle } from "lucide-react"
import { useVoiceInput } from "@/hooks/use-voice-input"
import { useTranslation } from "./translation-provider"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VoiceEnabledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onVoiceInput?: (value: string) => void
  label?: string
  maxListeningTime?: number
  className?: string
  inputClassName?: string
  buttonClassName?: string
}

export function VoiceEnabledInput({
  onVoiceInput,
  label,
  maxListeningTime = 10000,
  className,
  inputClassName,
  buttonClassName,
  value,
  onChange,
  ...props
}: VoiceEnabledInputProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState(value || "")
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle transcript change
  const handleTranscriptChange = (transcript: string) => {
    setInputValue(transcript)

    // Call the original onChange handler if provided
    if (onChange && transcript) {
      const event = {
        target: { value: transcript },
      } as React.ChangeEvent<HTMLInputElement>
      onChange(event)
    }

    // Call the onVoiceInput callback if provided
    if (onVoiceInput && transcript) {
      onVoiceInput(transcript)
    }
  }

  // Initialize voice input hook
  const { isListening, error, startListening, stopListening, supported } = useVoiceInput(
    handleTranscriptChange,
    true,
    maxListeningTime,
  )

  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value)
    }
  }, [value])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)

    // Call the original onChange handler if provided
    if (onChange) {
      onChange(e)
    }
  }

  // Handle voice button click
  const handleVoiceButtonClick = () => {
    if (isListening) {
      stopListening()
    } else {
      // Focus the input when starting to listen
      if (inputRef.current) {
        inputRef.current.focus()
      }
      startListening()
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      <div className="flex items-center space-x-2">
        <Input ref={inputRef} value={inputValue} onChange={handleInputChange} className={inputClassName} {...props} />

        {supported && (
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={handleVoiceButtonClick}
            className={cn("flex-shrink-0", buttonClassName)}
            aria-label={isListening ? t("voice.stop") : t("voice.start")}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {error === "not-allowed" ? t("voice.microphonePermissionDenied") : t("voice.error")}
          </AlertDescription>
        </Alert>
      )}

      {isListening && <div className="text-xs text-muted-foreground animate-pulse">{t("voice.listening")}...</div>}
    </div>
  )
}
