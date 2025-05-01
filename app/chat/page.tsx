"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TranslationProvider, useTranslation } from "../components/translation-provider"
import Navbar from "../components/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Check, CheckCheck, Clock } from "lucide-react"
import VoiceButton from "../components/voice-button"
import { useAuth } from "@/lib/auth-context"
import { ChatPresenceProvider, useChatPresence } from "@/lib/chat-presence-context"

interface ChatContact {
  id: string
  name: string
  role: "retailer" | "wholesaler" | "delivery" | "admin"
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  avatar?: string
  status?: "online" | "offline" | "away"
}

interface ChatMessage {
  id: string
  senderId: string
  content: string
  timestamp: string
  isRead: boolean
}

function ChatContent() {
  const { t, language } = useTranslation()
  const { user } = useAuth()
  const { activeUsers } = useChatPresence()
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Mock data - in a real app, this would come from an API
    const mockContacts: ChatContact[] = [
      {
        id: "1",
        name: "Vikram Singh",
        role: "wholesaler", // This is a wholesaler
        lastMessage: "Your order has been confirmed",
        lastMessageTime: "10:30 AM",
        unreadCount: 2,
        avatar: "/thoughtful-vikram.png",
      },
      {
        id: "2",
        name: "Suresh Patel",
        role: "delivery",
        lastMessage: "I am on my way to deliver",
        lastMessageTime: "Yesterday",
        unreadCount: 0,
        avatar: "/thoughtful-suresh.png",
      },
      {
        id: "3",
        name: "Admin Support",
        role: "admin",
        lastMessage: "How can I help you today?",
        lastMessageTime: "2 days ago",
        unreadCount: 0,
        avatar: "/stylized-admin-panel.png",
      },
      {
        id: "4",
        name: "Rajesh Kumar",
        role: "retailer", // This is a retailer
        lastMessage: "I need to place a new order",
        lastMessageTime: "3 days ago",
        unreadCount: 0,
        avatar: "/retail-storefront.png",
      },
    ]

    // Update contacts with presence information
    const updatedContacts = mockContacts.map((contact) => {
      const userPresence = activeUsers.find((u) => u.userId === contact.id)
      return {
        ...contact,
        status: userPresence?.status || "offline",
      }
    })

    // Filter contacts based on the current user's role
    const filteredContacts = updatedContacts.filter((contact) => {
      // Safety check - if no user is logged in, don't show any contacts
      if (!user) return false

      // Always show admin contacts to everyone
      if (contact.role === "admin") return true

      // Always show delivery contacts to everyone except other delivery users
      if (contact.role === "delivery" && user.role !== "delivery") return true

      // If current user is a retailer, show wholesalers
      if (user.role === "retailer" && contact.role === "wholesaler") return true

      // If current user is a wholesaler, show retailers
      if (user.role === "wholesaler" && contact.role === "retailer") return true

      // If current user is admin, show everyone
      if (user.role === "admin") return true

      // Filter out contacts with the same role as the current user
      // (retailers don't chat with retailers, wholesalers don't chat with wholesalers)
      if (user.role === contact.role) return false

      // Filter out the current user
      if (user.id === contact.id) return false

      return false // Default to not showing if none of the above conditions are met
    })

    // Remove duplicates (same user appearing multiple times)
    const uniqueContacts = filteredContacts.filter(
      (contact, index, self) => index === self.findIndex((c) => c.id === contact.id),
    )

    setContacts(uniqueContacts)
  }, [activeUsers, user])

  useEffect(() => {
    if (selectedContact) {
      // Mock messages for the selected contact
      const mockMessages: ChatMessage[] = [
        {
          id: "1",
          senderId: selectedContact.id,
          content: "Hello, how can I help you today?",
          timestamp: "10:00 AM",
          isRead: true,
        },
        {
          id: "2",
          senderId: "me",
          content: "I wanted to ask about my recent order",
          timestamp: "10:05 AM",
          isRead: true,
        },
        {
          id: "3",
          senderId: selectedContact.id,
          content: "Sure, which order are you referring to?",
          timestamp: "10:10 AM",
          isRead: true,
        },
        {
          id: "4",
          senderId: "me",
          content: "Order #ORD001 placed yesterday",
          timestamp: "10:15 AM",
          isRead: true,
        },
        {
          id: "5",
          senderId: selectedContact.id,
          content: "Let me check that for you",
          timestamp: "10:20 AM",
          isRead: true,
        },
        {
          id: "6",
          senderId: selectedContact.id,
          content: "Your order has been processed and will be dispatched soon",
          timestamp: "10:25 AM",
          isRead: true,
        },
      ]

      setMessages(mockMessages)

      // Mark messages as read
      if (selectedContact.unreadCount > 0) {
        setContacts(
          contacts.map((contact) => (contact.id === selectedContact.id ? { ...contact, unreadCount: 0 } : contact)),
        )
      }
    }
  }, [selectedContact])

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim() === "" || !selectedContact) return

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: "me",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isRead: false,
    }

    setMessages([...messages, newMsg])
    setNewMessage("")

    // Simulate reply after 1 second
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        senderId: selectedContact.id,
        content: getAutoReply(selectedContact.role),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isRead: true,
      }

      setMessages((prev) => [...prev, reply])
    }, 1000)
  }

  const getAutoReply = (role: string) => {
    switch (role) {
      case "wholesaler":
        return "Thanks for your message. I will process your order right away."
      case "retailer":
        return "Thank you for your response. I'll place my order soon."
      case "delivery":
        return "I will deliver your order as soon as possible."
      case "admin":
        return "How else can I assist you today?"
      default:
        return "Thank you for your message."
    }
  }

  const handleVoiceInput = (text: string) => {
    setNewMessage(text)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "retailer":
        return "bg-blue-100 text-blue-800"
      case "wholesaler":
        return "bg-orange-100 text-orange-800"
      case "delivery":
        return "bg-green-100 text-green-800"
      case "admin":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIndicator = (status?: string) => {
    switch (status) {
      case "online":
        return (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
        )
      case "away":
        return (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-yellow-500 border-2 border-white"></span>
        )
      case "offline":
      default:
        return (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-gray-300 border-2 border-white"></span>
        )
    }
  }

  // If no user is logged in, show a message
  if (!user) {
    return (
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-center h-[calc(100vh-136px)]">
          <div className="text-center p-8">
            <h3 className="text-xl font-semibold mb-2">Please log in</h3>
            <p className="text-gray-500">You need to be logged in to use the chat feature</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex flex-col md:flex-row h-[calc(100vh-136px)]">
        {/* Contacts List */}
        <div className="w-full md:w-1/3 border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="text-2xl font-bold">Chats</h2>
          </div>
          {contacts.length > 0 ? (
            <div className="divide-y">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    selectedContact?.id === contact.id ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {getStatusIndicator(contact.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold truncate">{contact.name}</h3>
                        <span className="text-xs text-gray-500">{contact.lastMessageTime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                        {contact.unreadCount > 0 && (
                          <Badge className="bg-blue-500 text-white">{contact.unreadCount}</Badge>
                        )}
                      </div>
                      <Badge className={`mt-1 ${getRoleColor(contact.role)}`}>
                        {contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>No contacts available for your role.</p>
              <p className="text-sm mt-2">
                {user.role === "admin"
                  ? "You should see all users. Please check your connection."
                  : `As a ${user.role}, you can chat with ${
                      user.role === "retailer"
                        ? "wholesalers and admin"
                        : user.role === "wholesaler"
                          ? "retailers and admin"
                          : "retailers, wholesalers, and admin"
                    }`}
              </p>
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedContact.avatar || "/placeholder.svg"} alt={selectedContact.name} />
                    <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {getStatusIndicator(selectedContact.status)}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedContact.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleColor(selectedContact.role)}>
                      {selectedContact.role.charAt(0).toUpperCase() + selectedContact.role.slice(1)}
                    </Badge>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      {selectedContact.status === "online" ? (
                        <>Online</>
                      ) : selectedContact.status === "away" ? (
                        <>
                          Away
                          <Clock className="h-3 w-3" />
                        </>
                      ) : (
                        <>Offline</>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] p-3 rounded-lg ${
                          message.senderId === "me" ? "bg-blue-500 text-white" : "bg-white border"
                        }`}
                      >
                        <p>{message.content}</p>
                        <div
                          className={`flex justify-end items-center mt-1 text-xs ${
                            message.senderId === "me" ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          <span>{message.timestamp}</span>
                          {message.senderId === "me" && (
                            <span className="ml-1">
                              {message.isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="h-12 text-lg"
                  />
                  <VoiceButton onText={handleVoiceInput} language={language} />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="h-12 w-12 p-0 bg-blue-500 hover:bg-blue-600"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center p-8">
                <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a contact to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Chat() {
  return (
    <TranslationProvider>
      <ChatPresenceProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow pt-16 pb-16">
            <ChatContent />
          </main>
        </div>
      </ChatPresenceProvider>
    </TranslationProvider>
  )
}
