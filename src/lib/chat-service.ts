// Simplified chat service without actual WebSocket (for demo purposes)
// In production, this would use Socket.io server

interface Message {
  id: string
  userId: string
  userName: string
  userRole: 'STUDENT' | 'INSTRUCTOR'
  content: string
  timestamp: Date
  type: 'message' | 'notification'
}

interface OnlineUser {
  id: string
  name: string
  role: 'STUDENT' | 'INSTRUCTOR'
  lastSeen: Date
}

// Global storage for chat messages and users
const globalForChat = globalThis as unknown as {
  chatMessages: Message[] | undefined
  onlineUsers: Map<string, OnlineUser> | undefined
  messageListeners: Map<string, (message: Message) => void> | undefined
}

const chatMessages: Message[] = globalForChat.chatMessages ?? []
const onlineUsers: Map<string, OnlineUser> = globalForChat.onlineUsers ?? new Map()
const messageListeners: Map<string, (message: Message) => void> = globalForChat.messageListeners ?? new Map()

globalForChat.chatMessages = chatMessages
globalForChat.onlineUsers = onlineUsers
globalForChat.messageListeners = messageListeners

export const chatService = {
  // Get recent messages
  getMessages(): Message[] {
    return chatMessages.slice(-50) // Return last 50 messages
  },

  // Add a new message
  addMessage(message: Omit<Message, 'id' | 'timestamp'>): Message {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      timestamp: new Date()
    }

    chatMessages.push(newMessage)

    // Notify all listeners
    messageListeners.forEach(listener => {
      try {
        listener(newMessage)
      } catch (error) {
        console.error('Error notifying message listener:', error)
      }
    })

    // Keep only last 100 messages to prevent memory issues
    if (chatMessages.length > 100) {
      chatMessages.splice(0, chatMessages.length - 100)
    }

    return newMessage
  },

  // User management
  addUser(user: OnlineUser): void {
    onlineUsers.set(user.id, { ...user, lastSeen: new Date() })
    
    // Add system notification
    this.addMessage({
      userId: 'system',
      userName: 'Sistema',
      userRole: 'INSTRUCTOR',
      content: `${user.name} se ha conectado al chat`,
      type: 'notification'
    })
  },

  removeUser(userId: string): void {
    const user = onlineUsers.get(userId)
    if (user) {
      onlineUsers.delete(userId)
      messageListeners.delete(userId)
      
      // Add system notification
      this.addMessage({
        userId: 'system',
        userName: 'Sistema',
        userRole: 'INSTRUCTOR',
        content: `${user.name} se ha desconectado del chat`,
        type: 'notification'
      })
    }
  },

  getOnlineUsers(): OnlineUser[] {
    return Array.from(onlineUsers.values())
  },

  updateUserActivity(userId: string): void {
    const user = onlineUsers.get(userId)
    if (user) {
      user.lastSeen = new Date()
    }
  },

  // Message listening (polling-based for simplicity)
  addMessageListener(userId: string, callback: (message: Message) => void): void {
    messageListeners.set(userId, callback)
  },

  removeMessageListener(userId: string): void {
    messageListeners.delete(userId)
  },

  // Cleanup inactive users (call periodically)
  cleanupInactiveUsers(): void {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    for (const [userId, user] of onlineUsers.entries()) {
      if (user.lastSeen < fiveMinutesAgo) {
        this.removeUser(userId)
      }
    }
  }
}

// Cleanup inactive users every 5 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    chatService.cleanupInactiveUsers()
  }, 5 * 60 * 1000)
}