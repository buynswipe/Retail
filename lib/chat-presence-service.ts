import { supabase } from "./supabase-client"

interface ChatPresence {
  userId: string
  username: string
  role: string
  lastActive: string
  status: "online" | "offline" | "away"
  sessionId: string
}

export const chatPresenceService = {
  /**
   * Register user presence in the chat system
   */
  async registerPresence(userId: string, username: string, role: string): Promise<string> {
    // Generate a unique session ID for this login instance
    const sessionId = crypto.randomUUID()

    // Check if user is already present with an active session
    const { data: existingPresence } = await supabase
      .from("chat_presence")
      .select("*")
      .eq("userId", userId)
      .eq("status", "online")
      .single()

    if (existingPresence) {
      // User is already present, update the last active timestamp
      await supabase
        .from("chat_presence")
        .update({
          lastActive: new Date().toISOString(),
          sessionId: sessionId,
        })
        .eq("userId", userId)

      return sessionId
    }

    // User is not present, create a new presence record
    await supabase.from("chat_presence").insert({
      userId,
      username,
      role,
      lastActive: new Date().toISOString(),
      status: "online",
      sessionId,
    })

    return sessionId
  },

  /**
   * Update user's presence status
   */
  async updateStatus(userId: string, sessionId: string, status: "online" | "offline" | "away"): Promise<void> {
    await supabase
      .from("chat_presence")
      .update({
        status,
        lastActive: new Date().toISOString(),
      })
      .eq("userId", userId)
      .eq("sessionId", sessionId)
  },

  /**
   * Mark user as offline when they log out or close the app
   */
  async markOffline(userId: string, sessionId: string): Promise<void> {
    await supabase
      .from("chat_presence")
      .update({
        status: "offline",
        lastActive: new Date().toISOString(),
      })
      .eq("userId", userId)
      .eq("sessionId", sessionId)
  },

  /**
   * Get all active users in the chat
   */
  async getActiveUsers(): Promise<ChatPresence[]> {
    const { data } = await supabase
      .from("chat_presence")
      .select("*")
      .eq("status", "online")
      .order("lastActive", { ascending: false })

    return data || []
  },

  /**
   * Subscribe to presence changes
   */
  subscribeToPresenceChanges(callback: (presences: ChatPresence[]) => void): () => void {
    const subscription = supabase
      .channel("chat_presence_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_presence" }, async () => {
        const activeUsers = await this.getActiveUsers()
        callback(activeUsers)
      })
      .subscribe()

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe()
    }
  },

  /**
   * Heartbeat to keep the user's presence active
   */
  async heartbeat(userId: string, sessionId: string): Promise<void> {
    await supabase
      .from("chat_presence")
      .update({
        lastActive: new Date().toISOString(),
      })
      .eq("userId", userId)
      .eq("sessionId", sessionId)
  },
}
