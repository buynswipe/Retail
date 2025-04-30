"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "@/app/components/translation-provider"

// Define the return type for our hook
export interface UseVoiceInputReturn {
  isListening: boolean
  transcript: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  supported: boolean
}

// Declare SpeechRecognition interface
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
  interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList | null
    lang: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    serviceURI: string
    start: () => void
    stop: () => void
    abort: () => void
    addEventListener<K extends keyof SpeechRecognitionEventMap>(
      type: K,
      listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions,
    ): void
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ): void
    removeEventListener<K extends keyof SpeechRecognitionEventMap>(
      type: K,
      listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any,
      options?: boolean | EventListenerOptions,
    ): void
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ): void
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
    onend: ((this: SpeechRecognition, ev: Event) => any) | null
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number
    results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult
    length: number
    item(index: number): SpeechRecognitionResult
  }

  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative
    length: number
    isFinal: boolean
    item(index: number): SpeechRecognitionAlternative
  }

  interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
  }

  interface SpeechGrammarList {
    length: number
    item(index: number): SpeechGrammar
    addFromString(string: string, weight?: number): void
    addFromURI(uri: string, weight?: number): void
  }

  interface SpeechGrammar {}

  interface SpeechRecognitionEventMap {
    audioend: Event
    audiostart: Event
    end: Event
    error: SpeechRecognitionErrorEvent
    nomatch: SpeechRecognitionEvent
    result: SpeechRecognitionEvent
    soundend: Event
    soundstart: Event
    speechend: Event
    speechstart: Event
    start: Event
  }
}

export function useVoiceInput(
  onTranscriptChange?: (transcript: string) => void,
  autoStop = true,
  maxListeningTime = 10000, // Default 10 seconds
): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)
  const { currentLanguage } = useTranslation()

  // Use refs for speech recognition to avoid recreating on each render
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI()

        // Set language based on current app language
        recognitionRef.current.lang = currentLanguage === "hi" ? "hi-IN" : "en-US"
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true

        // Set up event handlers
        recognitionRef.current.onresult = (event) => {
          const current = event.resultIndex
          const result = event.results[current]
          const transcriptValue = result[0].transcript

          setTranscript(transcriptValue)
          if (onTranscriptChange) {
            onTranscriptChange(transcriptValue)
          }

          // If result is final and autoStop is enabled, stop listening
          if (result.isFinal && autoStop) {
            stopListening()
          }
        }

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error)
          setError(event.error)
          stopListening()
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      } else {
        setSupported(false)
        setError("Speech recognition is not supported in this browser")
      }
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        stopListening()
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [currentLanguage, onTranscriptChange, autoStop])

  // Start listening function
  const startListening = useCallback(() => {
    setError(null)

    if (!recognitionRef.current) {
      setError("Speech recognition is not initialized")
      return
    }

    try {
      recognitionRef.current.start()
      setIsListening(true)

      // Set timeout to automatically stop listening after maxListeningTime
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        stopListening()
      }, maxListeningTime)
    } catch (err) {
      console.error("Error starting speech recognition:", err)
      setError("Failed to start speech recognition")
    }
  }, [maxListeningTime])

  // Stop listening function
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (err) {
        // Ignore errors when stopping (usually happens if not started)
      }
    }

    setIsListening(false)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Reset transcript function
  const resetTranscript = useCallback(() => {
    setTranscript("")
    if (onTranscriptChange) {
      onTranscriptChange("")
    }
  }, [onTranscriptChange])

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    supported,
  }
}
