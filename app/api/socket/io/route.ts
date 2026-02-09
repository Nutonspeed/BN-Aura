// Next.js 15 App Router Compatible Socket.IO Server
// Real-time WebSocket server for BN-Aura analytics and notifications

import { NextRequest } from 'next/server';
import { Server as NetServer } from 'http';
import { Server as ServerIO, Socket } from 'socket.io';
import { createAdminClient } from '@/lib/supabase/admin';

import { requireAuth } from '@/lib/auth/withAuth';import { ErrorHandler } from '@/lib/monitoring/sentry';

interface AuthenticatedSocket extends Socket {
  userId: string;
  clinicId?: string;
  role: string;
}

interface AnalyticsEvent {
  type: 'user_action' | 'system_event' | 'performance_metric';
  category: string;
  action: string;
  userId?: string;
  clinicId?: string;
  data: any;
  timestamp: string;
}

// Global Socket.IO server instance
let io: ServerIO | undefined;

export async function GET(req: NextRequest) {
  if (!io) {
    // Initialize Socket.IO server only once
    const httpServer = (global as any).__httpServer;
    
    if (!httpServer) {
      return new Response('HTTP Server not available', { status: 500 });
    }

    io = new ServerIO(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://bnaura.com', 'https://royeyoxaaieipdajijni.supabase.co'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Authentication middleware
    io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token with Supabase
        const adminClient = createAdminClient();
        const { data: { user }, error } = await adminClient.auth.getUser(token);

        if (error || !user) {
          return next(new Error('Invalid authentication token'));
        }

        // Get user details from database
        const { data: userData, error: userError } = await adminClient
          .from('users')
          .select('id, role, clinic_id, is_active')
          .eq('id', user.id)
          .single();

        if (userError || !userData || !userData.is_active) {
          return next(new Error('User not found or inactive'));
        }

        socket.userId = userData.id;
        socket.clinicId = userData.clinic_id;
        socket.role = userData.role;
        
        next();
      } catch (error) {
        ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
        next(new Error('Authentication failed'));
      }
    });

    io.on('connection', (socket: any) => {
      console.log(`🔗 User connected: ${socket.userId} (${socket.role})`);

      // Join appropriate rooms
      socket.join(`user:${socket.userId}`);
      
      if (socket.clinicId) {
        socket.join(`clinic:${socket.clinicId}`);
      }
      
      if (socket.role) {
        socket.join(`role:${socket.role}`);
      }

      // Handle analytics events
      socket.on('analytics:event', async (event: AnalyticsEvent) => {
        try {
          // Add user context
          event.userId = socket.userId;
          event.clinicId = socket.clinicId;
          event.timestamp = new Date().toISOString();

          // Store in database for analytics
          const adminClient = createAdminClient();
          const { error: insertError } = await adminClient
            .from('analytics_events')
            .insert({
              event_type: event.type,
              clinic_id: event.clinicId,
              payload: {
                category: event.category,
                action: event.action,
                userId: event.userId,
                data: event.data,
                timestamp: event.timestamp
              },
              created_at: event.timestamp
            });

          if (insertError) {
            console.error('❌ Failed to store analytics event:', insertError);
          } else {
            console.log(`✅ Analytics event stored: ${event.category}/${event.action}`);
          }

          // Broadcast to admin dashboard if relevant
          if (['super_admin', 'clinic_admin'].includes(socket.role)) {
            io?.to(`role:super_admin`).emit('analytics:update', event);
            if (socket.clinicId) {
              io?.to(`clinic:${socket.clinicId}`).emit('analytics:update', event);
            }
          }
        } catch (error) {
          console.error('❌ Analytics event error:', error);
        }
      });

      // Handle notifications
      socket.on('notification:send', async (data: {
        targetUsers?: string[];
        targetRoles?: string[];
        targetClinics?: string[];
        notification: any;
      }) => {
        try {
          // Send to specific users
          if (data.targetUsers) {
            data.targetUsers.forEach(userId => {
              io?.to(`user:${userId}`).emit('notification', { data: data.notification });
            });
          }

          // Send to specific roles
          if (data.targetRoles) {
            data.targetRoles.forEach(role => {
              io?.to(`role:${role}`).emit('notification', { data: data.notification });
            });
          }

          // Send to specific clinics
          if (data.targetClinics) {
            data.targetClinics.forEach(clinicId => {
              io?.to(`clinic:${clinicId}`).emit('notification', { data: data.notification });
            });
          }
        } catch (error) {
          console.error('❌ Notification send error:', error);
        }
      });

      // Handle presence updates
      socket.on('presence:update', (data: { status: string; metadata?: any }) => {
        socket.broadcast.emit('presence:update', {
          userId: socket.userId,
          status: data.status,
          lastSeen: new Date().toISOString(),
          metadata: data.metadata
        });
      });

      // Handle typing indicators
      socket.on('typing:start', (data: { channelId: string; type?: string }) => {
        socket.broadcast.to(data.channelId).emit('typing:indicator', {
          userId: socket.userId,
          isTyping: true,
          type: data.type
        });
      });

      socket.on('typing:stop', (data: { channelId: string }) => {
        socket.broadcast.to(data.channelId).emit('typing:indicator', {
          userId: socket.userId,
          isTyping: false
        });
      });

      // Handle collaboration
      socket.on('collaboration:join', (channelId: string) => {
        socket.join(channelId);
        socket.to(channelId).emit('collaboration:user_joined', {
          type: 'user_joined',
          userId: socket.userId,
          channelId
        });
      });

      socket.on('collaboration:leave', (channelId: string) => {
        socket.leave(channelId);
        socket.to(channelId).emit('collaboration:user_left', {
          type: 'user_left',
          userId: socket.userId,
          channelId
        });
      });

      // Handle subscription requests
      socket.on('subscribe:notifications', (filters: {
        clinicId?: string;
        role?: string;
      }) => {
        try {
          const rooms: string[] = [];
          
          if (filters.clinicId && socket.clinicId === filters.clinicId) {
            rooms.push(`clinic:${filters.clinicId}`);
          }
          
          if (filters.role && socket.role === filters.role) {
            rooms.push(`role:${filters.role}`);
          }

          rooms.forEach(room => socket.join(room));
          
          socket.emit('subscription:success', { rooms });
        } catch (error) {
          socket.emit('subscription:error', { 
            message: 'Subscription failed' 
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason: any) => {
        console.log(`🔌 User disconnected: ${socket.userId} (${reason})`);
        
        // Broadcast offline status
        socket.broadcast.emit('presence:update', {
          userId: socket.userId,
          status: 'offline',
          lastSeen: new Date().toISOString()
        });
      });
    });

    console.log('🚀 Socket.IO server initialized successfully');
  }

  return new Response('Socket.IO server running', { status: 200 });
}

// Export for other methods if needed
export { GET as POST };
