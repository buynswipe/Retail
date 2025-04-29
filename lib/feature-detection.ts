"use client"

import { useState, useEffect } from "react"

// Feature detection utility to check browser capabilities
export const detectFeatures = () => {
  const features = {
    serviceWorker: "serviceWorker" in navigator,
    indexedDB: "indexedDB" in window,
    cacheAPI: "caches" in window,
    notifications: "Notification" in window,
    geolocation: "geolocation" in navigator,
    webShare: "share" in navigator,
    paymentRequest: "PaymentRequest" in window,
    speechRecognition: "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    webRTC: "RTCPeerConnection" in window,
    webGL: (() => {
      try {
        const canvas = document.createElement("canvas")
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        )
      } catch (e) {
        return false
      }
    })(),
    touchEvents: "ontouchstart" in window,
    deviceOrientation: "DeviceOrientationEvent" in window,
    deviceMotion: "DeviceMotionEvent" in window,
    bluetooth: "bluetooth" in navigator,
    batteryAPI: "getBattery" in navigator,
    networkInformation: "connection" in navigator,
    vibration: "vibrate" in navigator,
    mediaRecorder: "MediaRecorder" in window,
  }

  return features
}

// React hook for feature detection
export const useFeatureDetection = () => {
  const [features, setFeatures] = useState(detectFeatures())

  useEffect(() => {
    // Update features on mount to ensure client-side detection
    setFeatures(detectFeatures())
  }, [])

  return features
}

// Function to check if a specific feature is available
export const hasFeature = (featureName: keyof ReturnType<typeof detectFeatures>) => {
  if (typeof window === "undefined") return false
  return detectFeatures()[featureName]
}

// Function to provide fallbacks for unavailable features
export const getFeatureFallback = (featureName: string) => {
  const fallbacks: Record<string, () => void> = {
    serviceWorker: () => console.log("Service Worker not supported. Some offline features may not work."),
    indexedDB: () => console.log("IndexedDB not supported. Offline data storage will be limited."),
    notifications: () => console.log("Notifications not supported. You will not receive push notifications."),
    geolocation: () => console.log("Geolocation not supported. Location-based features will be disabled."),
    webShare: () => console.log("Web Share API not supported. Using fallback share options."),
    speechRecognition: () => console.log("Speech Recognition not supported. Voice input features will be disabled."),
  }

  return fallbacks[featureName] || (() => console.log(`No fallback available for ${featureName}`))
}

// Function to gracefully degrade when features are not available
export const gracefulDegradation = (
  featureName: string,
  featureImplementation: () => any,
  fallbackImplementation: () => any,
) => {
  if (typeof window === "undefined") return fallbackImplementation()

  const features = detectFeatures()
  const featureKey = featureName as keyof typeof features

  if (features[featureKey]) {
    return featureImplementation()
  } else {
    return fallbackImplementation()
  }
}
