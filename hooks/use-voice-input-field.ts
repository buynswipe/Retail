"use client"

import { useState, useEffect, useCallback } from "react"

interface VoiceInputOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  autoStart?: boolean
}

// Define SpeechRecognition type
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
  interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList
    lang: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    serviceURI: string
    start(): void
    stop(): void
    abort(): void
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

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number
    readonly results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionResultList extends Array<SpeechRecognitionResult> {
    item(index: number): SpeechRecognitionResult
  }

  interface SpeechRecognitionResult extends Array<SpeechRecognitionAlternative> {
    readonly isFinal: boolean
    item(index: number): SpeechRecognitionAlternative
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }

  interface SpeechGrammarList extends EventTarget {
    length: number
    item(index: number): SpeechGrammar
    addFromString(string: string, weight?: number): void
    addFromURI(uri: string, weight?: number): void
  }

  interface SpeechGrammar {}

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionError
    readonly message: string
  }

  type SpeechRecognitionError =
    | "no-speech"
    | "aborted"
    | "audio-capture"
    | "network"
    | "not-allowed"
    | "service-not-allowed"
    | "bad-grammar"
    | "language-not-supported"

  interface SpeechRecognitionEventMap {
    start: Event
    result: SpeechRecognitionEvent
    end: Event
    error: SpeechRecognitionErrorEvent
    nomatch: Event
  }
}

export function useVoiceInputField(options: VoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser")
      return
    }

    try {
      const recognitionInstance = new SpeechRecognition()

      // Configure recognition
      recognitionInstance.lang = options.language || "en-US"
      recognitionInstance.continuous = options.continuous ?? false
      recognitionInstance.interimResults = options.interimResults ?? true

      // Set up event handlers
      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex
        const result = event.results[current]
        const transcriptValue = result[0].transcript

        setTranscript(transcriptValue)

        if (options.onResult) {
          options.onResult(transcriptValue)
        }
      }

      recognitionInstance.onerror = (event) => {
        const errorMessage = event.error || "Unknown error occurred"
        setError(errorMessage)

        if (options.onError) {
          options.onError(errorMessage)
        }

        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)

      // Auto-start if specified
      if (options.autoStart) {
        startListening()
      }
    } catch (err) {
      setError("Error initializing speech recognition")
      console.error("Speech recognition error:", err)
    }

    // Cleanup
    return () => {
      if (recognition) {
        recognition.onresult = null
        recognition.onerror = null
        recognition.onend = null

        if (isListening) {
          recognition.abort()
        }
      }
    }
  }, [])

  // Start listening function
  const startListening = useCallback(() => {
    if (!recognition) return

    try {
      recognition.start()
      setIsListening(true)
      setError(null)
    } catch (err) {
      setError("Error starting speech recognition")
      console.error("Speech recognition start error:", err)
    }
  }, [recognition])

  // Stop listening function
  const stopListening = useCallback(() => {
    if (!recognition) return

    try {
      recognition.stop()
      setIsListening(false)
    } catch (err) {
      setError("Error stopping speech recognition")
      console.error("Speech recognition stop error:", err)
    }
  }, [recognition])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript("")
  }, [])

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: !!recognition,
  }
}
