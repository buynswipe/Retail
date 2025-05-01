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
    const { data: existingPresence, error } = await supabase
      .from("chat_presence")
      .select("*")
      .eq("userId", userId)
      .eq("status", "online")
      .single()

    // Handle potential errors
    if (error && error.code !== "PGRST116") {
      console.error("Error checking presence:", error)
      // Return session ID anyway to prevent blocking the user
      return sessionId
    }

    if (existingPresence) {
      // User is already present, update the last active timestamp
      await supabase
        .from("chat_presence")
        .update({
          lastActive: new Date().toISOString(),
          sessionId: sessionId,
          username: username, // Update username in case it changed
          role: role, // Update role in case it changed
        })
        .eq("userId", userId)
        .eq("sessionId", existingPresence.sessionId)

      return sessionId
    }

    // User is not present, create a new presence record
    const { error: insertError } = await supabase.from("chat_presence").insert({
      userId,
      username,
      role,
      lastActive: new Date().toISOString(),
      status: "online",
      sessionId,
    })

    if (insertError) {
      console.error("Error registering presence:", insertError)
    }

    return sessionId
  },

  /**
   * Update user's presence status
   */
  async updateStatus(userId: string, sessionId: string, status: "online" | "offline" | "away"): Promise<void> {
    if (!userId || !sessionId) {
      console.error("Missing userId or sessionId for updateStatus")
      return
    }

    const { error } = await supabase
      .from("chat_presence")
      .update({
        status,
        lastActive: new Date().toISOString(),
      })
      .eq("userId", userId)
      .eq("sessionId", sessionId)

    if (error) {
      console.error("Error updating status:", error)
    }
  },

  /**
   * Mark user as offline when they log out or close the app
   */
  async markOffline(userId: string, sessionId: string): Promise<void> {
    if (!userId || !sessionId) {
      console.error("Missing userId or sessionId for markOffline")
      return
    }

    const { error } = await supabase
      .from("chat_presence")
      .update({
        status: "offline",
        lastActive: new Date().toISOString(),
      })
      .eq("userId", userId)
      .eq("sessionId", sessionId)

    if (error) {
      console.error("Error marking offline:", error)
    }
  },

  /**
   * Get all active users in the chat
   */
  async getActiveUsers(): Promise<ChatPresence[]> {
    try {
      const { data, error } = await supabase
        .from("chat_presence")
        .select("*")
        .eq("status", "online")
        .order("lastActive", { ascending: false })

      if (error) {
        console.error("Error getting active users:", error)
        return []
      }

      return data || []
    } catch (err) {
      console.error("Exception getting active users:", err)
      return []
    }
  },

  /**
   * Subscribe to presence changes
   */
  subscribeToPresenceChanges(callback: (presences: ChatPresence[]) => void): () => void {
    const subscription = supabase
      .channel("chat_presence_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_presence" }, async () => {
        try {
          const activeUsers = await this.getActiveUsers()
          callback(activeUsers)
        } catch (err) {
          console.error("Error in presence subscription:", err)
          callback([])
        }
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
    if (!userId || !sessionId) {
      console.error("Missing userId or sessionId for heartbeat")
      return
    }

    const { error } = await supabase
      .from("chat_presence")
      .update({
        lastActive: new Date().toISOString(),
      })
      .eq("userId", userId)
      .eq("sessionId", sessionId)

    if (error) {
      console.error("Error updating heartbeat:", error)
    }
  },

  /**
   * Get compatible chat contacts for a user based on their role
   */
  async getCompatibleContacts(userRole: string, userId: string): Promise<ChatPresence[]> {
    try {
      const { data: allUsers, error } = await supabase.from("chat_presence").select("*").neq("userId", userId) // Exclude the current user

      if (error) {
        console.error("Error getting compatible contacts:", error)
        return []
      }

      // Filter users based on role compatibility
      const compatibleUsers = allUsers.filter((user) => {
        // Admins can chat with everyone
        if (userRole === "admin") return true

        // Everyone can chat with admins
        if (user.role === "admin") return true

        // Retailers can chat with wholesalers and delivery
        if (userRole === "retailer" && (user.role === "wholesaler" || user.role === "delivery")) return true

        // Wholesalers can chat with retailers and delivery
        if (userRole === "wholesaler" && (user.role === "retailer" || user.role === "delivery")) return true

        // Delivery can chat with retailers and wholesalers
        if (userRole === "delivery" && (user.role === "retailer" || user.role === "wholesaler")) return true

        return false
      })

      return compatibleUsers
    } catch (err) {
      console.error("Exception getting compatible contacts:", err)
      return []
    }
  },
}
