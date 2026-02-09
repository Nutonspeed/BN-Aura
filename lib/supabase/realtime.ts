import { RealtimeChannel, RealtimeClient } from '@supabase/supabase-js'
import { createClient } from './client'

export interface RealtimeEvent {
  type: string
  payload: any
  timestamp: string
}

export class RealtimeManager {
  private client: RealtimeClient
  private channels: Map<string, RealtimeChannel> = new Map()

  constructor() {
    this.client = createClient().realtime
  }

  /**
   * Subscribe to chat messages for a specific conversation
   */
  subscribeToChat(conversationId: string, callbacks: {
    onMessage?: (payload: any) => void
    onTyping?: (payload: any) => void
    onStatusChange?: (payload: any) => void
  }) {
    const channelName = `chat:${conversationId}`
    
    // Unsubscribe from existing channel if any
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe()
    }

    const channel = this.client.channel(channelName)
    
    // Listen for new messages
    if (callbacks.onMessage) {
      channel.on('broadcast', { event: 'new_message' }, (payload) => {
        callbacks.onMessage?.(payload.payload)
      })
    }

    // Listen for typing indicators
    if (callbacks.onTyping) {
      channel.on('broadcast', { event: 'typing' }, (payload) => {
        callbacks.onTyping?.(payload.payload)
      })
    }

    // Listen for status changes (read/unread)
    if (callbacks.onStatusChange) {
      channel.on('broadcast', { event: 'status_change' }, (payload) => {
        callbacks.onStatusChange?.(payload.payload)
      })
    }

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`Chat channel ${conversationId} status:`, status)
    })

    this.channels.set(channelName, channel)
    return channel
  }

  /**
   * Subscribe to clinic-wide notifications
   */
  subscribeToClinicNotifications(clinicId: string, callbacks: {
    onNotification?: (payload: any) => void
    onStaffUpdate?: (payload: any) => void
    onAppointmentUpdate?: (payload: any) => void
  }) {
    const channelName = `clinic:${clinicId}`
    
    // Unsubscribe from existing channel if any
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe()
    }

    const channel = this.client.channel(channelName)
    
    // Listen for notifications
    if (callbacks.onNotification) {
      channel.on('broadcast', { event: 'notification' }, (payload) => {
        callbacks.onNotification?.(payload.payload)
      })
    }

    // Listen for staff updates
    if (callbacks.onStaffUpdate) {
      channel.on('broadcast', { event: 'staff_update' }, (payload) => {
        callbacks.onStaffUpdate?.(payload.payload)
      })
    }

    // Listen for appointment updates
    if (callbacks.onAppointmentUpdate) {
      channel.on('broadcast', { event: 'appointment_update' }, (payload) => {
        callbacks.onAppointmentUpdate?.(payload.payload)
      })
    }

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`Clinic channel ${clinicId} status:`, status)
    })

    this.channels.set(channelName, channel)
    return channel
  }

  /**
   * Subscribe to user-specific notifications
   */
  subscribeToUserNotifications(userId: string, callbacks: {
    onNotification?: (payload: any) => void
    onMessage?: (payload: any) => void
  }) {
    const channelName = `user:${userId}`
    
    // Unsubscribe from existing channel if any
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe()
    }

    const channel = this.client.channel(channelName)
    
    // Listen for notifications
    if (callbacks.onNotification) {
      channel.on('broadcast', { event: 'notification' }, (payload) => {
        callbacks.onNotification?.(payload.payload)
      })
    }

    // Listen for messages
    if (callbacks.onMessage) {
      channel.on('broadcast', { event: 'new_message' }, (payload) => {
        callbacks.onMessage?.(payload.payload)
      })
    }

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`User channel ${userId} status:`, status)
    })

    this.channels.set(channelName, channel)
    return channel
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    this.channels.forEach((channel) => {
      channel.unsubscribe()
    })
    this.channels.clear()
  }

  /**
   * Send a message to a chat channel
   */
  sendChatMessage(conversationId: string, message: any) {
    const channel = this.channels.get(`chat:${conversationId}`)
    if (channel) {
      return channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: message
      })
    }
    return Promise.reject(new Error('Channel not found'))
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, payload: any) {
    const channel = this.channels.get(`chat:${conversationId}`)
    if (channel) {
      return channel.send({
        type: 'broadcast',
        event: 'typing',
        payload
      })
    }
    return Promise.reject(new Error('Channel not found'))
  }

  /**
   * Send clinic notification
   */
  sendClinicNotification(clinicId: string, notification: any) {
    const channel = this.channels.get(`clinic:${clinicId}`)
    if (channel) {
      return channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: notification
      })
    }
    return Promise.reject(new Error('Channel not found'))
  }

  /**
   * Send user notification
   */
  sendUserNotification(userId: string, notification: any) {
    const channel = this.channels.get(`user:${userId}`)
    if (channel) {
      return channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: notification
      })
    }
    return Promise.reject(new Error('Channel not found'))
  }
}

// Singleton instance
export const realtimeManager = new RealtimeManager()
