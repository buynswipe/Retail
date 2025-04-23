"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TranslationProvider, useTranslation } from "../components/translation-provider"
import Navbar from "../components/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Check, CheckCheck } from "lucide-react"
import VoiceButton from "../components/voice-button"

interface ChatContact {
  id: string
  name: string
  role: "retailer" | "wholesaler" | "delivery" | "admin"
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  avatar?: string
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
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Mock data
    const mockContacts: ChatContact[] = [
      {
        id: "1",
        name: "Vikram Singh",
        role: "wholesaler",
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
    ]

    setContacts(mockContacts)
  }, [])

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

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex flex-col md:flex-row h-[calc(100vh-136px)]">
        {/* Contacts List */}
        <div className="w-full md:w-1/3 border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="text-2xl font-bold">Chats</h2>
          </div>
          <div className="divide-y">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedContact?.id === contact.id ? "bg-gray-100" : ""}`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
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
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedContact.avatar || "/placeholder.svg"} alt={selectedContact.name} />
                  <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedContact.name}</h3>
                  <Badge className={getRoleColor(selectedContact.role)}>
                    {selectedContact.role.charAt(0).toUpperCase() + selectedContact.role.slice(1)}
                  </Badge>
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
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16 pb-16">
          <ChatContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
