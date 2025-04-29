// Notification sound utility for playing sounds when notifications are received

// Define available notification sounds
export const NotificationSounds = {
  DEFAULT: "/sounds/notification-default.mp3",
  MESSAGE: "/sounds/notification-message.mp3",
  ORDER: "/sounds/notification-order.mp3",
  PAYMENT: "/sounds/notification-payment.mp3",
  DELIVERY: "/sounds/notification-delivery.mp3",
  ALERT: "/sounds/notification-alert.mp3",
}

// Sound volume settings (0.0 to 1.0)
const DEFAULT_VOLUME = 0.5

// Cache for preloaded audio elements
const audioCache: Record<string, HTMLAudioElement> = {}

/**
 * Preload notification sounds for faster playback
 * @param sounds Array of sound URLs to preload
 */
export const preloadNotificationSounds = (sounds: string[] = Object.values(NotificationSounds)) => {
  if (typeof window === "undefined") return

  sounds.forEach((sound) => {
    if (!audioCache[sound]) {
      const audio = new Audio(sound)
      audio.preload = "auto"
      audioCache[sound] = audio

      // Load the audio file
      audio.load()
    }
  })
}

/**
 * Play a notification sound
 * @param sound Sound URL to play
 * @param volume Volume level (0.0 to 1.0)
 * @returns Promise that resolves when the sound finishes playing
 */
export const playNotificationSound = async (
  sound: string = NotificationSounds.DEFAULT,
  volume: number = DEFAULT_VOLUME,
): Promise<void> => {
  if (typeof window === "undefined") return

  try {
    // Use cached audio if available, otherwise create a new one
    const audio = audioCache[sound] || new Audio(sound)

    // Set volume
    audio.volume = Math.max(0, Math.min(1, volume))

    // Reset audio to beginning if it was already played
    audio.currentTime = 0

    // Play the sound
    await audio.play()

    // Cache the audio for future use if not already cached
    if (!audioCache[sound]) {
      audioCache[sound] = audio
    }

    // Return a promise that resolves when the sound finishes playing
    return new Promise((resolve) => {
      audio.onended = () => resolve()
    })
  } catch (error) {
    console.error("Failed to play notification sound:", error)
  }
}

/**
 * Stop a currently playing notification sound
 * @param sound Sound URL to stop
 */
export const stopNotificationSound = (sound: string = NotificationSounds.DEFAULT): void => {
  if (typeof window === "undefined") return

  const audio = audioCache[sound]
  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }
}

/**
 * Play a notification sound based on notification type
 * @param notificationType Type of notification
 * @param volume Volume level (0.0 to 1.0)
 */
export const playNotificationSoundByType = (
  notificationType: "message" | "order" | "payment" | "delivery" | "alert" | "default",
  volume: number = DEFAULT_VOLUME,
): Promise<void> => {
  const soundMap: Record<string, string> = {
    message: NotificationSounds.MESSAGE,
    order: NotificationSounds.ORDER,
    payment: NotificationSounds.PAYMENT,
    delivery: NotificationSounds.DELIVERY,
    alert: NotificationSounds.ALERT,
    default: NotificationSounds.DEFAULT,
  }

  const sound = soundMap[notificationType] || NotificationSounds.DEFAULT
  return playNotificationSound(sound, volume)
}

// Preload all notification sounds when this module is imported
if (typeof window !== "undefined") {
  // Delay preloading to not block initial page load
  setTimeout(() => {
    preloadNotificationSounds()
  }, 2000)
}
