// WebSocket Server for BN-Aura Real-time Features
// Handles real-time notifications, updates, and collaboration

import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO, Socket } from 'socket.io';
import { createAdminClient } from '@/lib/supabase/admin';
import { ErrorHandler } from '@/lib/monitoring/sentry';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  clinicId?: string;
  role: string;
}

export interface NotificationPayload {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetUsers?: string[];
  targetRoles?: string[];
  targetClinics?: string[];
}

export interface AnalyticsEvent {
  type: 'user_action' | 'system_event' | 'performance_metric';
  category: string;
  action: string;
  userId?: string;
  clinicId?: string;
  data: any;
  timestamp: string;
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponse & { socket: any }) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://bnaura.com'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST']
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
      console.log(`User connected: ${socket.userId} (${socket.role})`);

      // Join appropriate rooms
      socket.join(`user:${socket.userId}`);
      
      if (socket.clinicId) {
        socket.join(`clinic:${socket.clinicId}`);
      }

      socket.join(`role:${socket.role}`);

      // Handle notification subscriptions
      socket.on('subscribe:notifications', async (filters: any) => {
        try {
          const rooms = [];
          
          if (filters?.clinicId && socket.role === 'super_admin') {
            rooms.push(`clinic:${filters.clinicId}`);
          }
          
          if (filters?.role) {
            rooms.push(`role:${filters.role}`);
          }

          rooms.forEach(room => socket.join(room));
          
          socket.emit('subscription:success', { rooms });
        } catch (error) {
          socket.emit('subscription:error', { message: 'Failed to subscribe' });
        }
      });

      // Handle real-time analytics events
      socket.on('analytics:event', async (event: AnalyticsEvent) => {
        try {
          // Add user context
          event.userId = socket.userId;
          event.clinicId = socket.clinicId;
          event.timestamp = new Date().toISOString();

          // Store in database for analytics
          const adminClient = createAdminClient();
          await adminClient
            .from('analytics_events')
            .insert({
              ...event,
              created_at: event.timestamp
            });

          // Broadcast to admin dashboard if relevant
          if (socket.role === 'super_admin' || socket.role === 'clinic_admin') {
            io.to(`role:super_admin`).emit('analytics:update', event);
            if (socket.clinicId) {
              io.to(`clinic:${socket.clinicId}`).emit('analytics:update', event);
            }
          }
        } catch (error) {
          ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
          socket.emit('analytics:error', { message: 'Failed to record analytics event' });
        }
      });

      // Handle typing indicators for collaboration
      socket.on('typing:start', (data: { channelId: string; type: string }) => {
        socket.to(`channel:${data.channelId}`).emit('typing:indicator', {
          userId: socket.userId,
          isTyping: true,
          type: data.type
        });
      });

      socket.on('typing:stop', (data: { channelId: string }) => {
        socket.to(`channel:${data.channelId}`).emit('typing:indicator', {
          userId: socket.userId,
          isTyping: false
        });
      });

      // Handle real-time collaboration
      socket.on('collaboration:join', (channelId: string) => {
        socket.join(`channel:${channelId}`);
        socket.emit('collaboration:joined', { channelId });
        
        // Notify others in the channel
        socket.to(`channel:${channelId}`).emit('collaboration:user_joined', {
          userId: socket.userId,
          channelId
        });
      });

      socket.on('collaboration:leave', (channelId: string) => {
        socket.leave(`channel:${channelId}`);
        socket.to(`channel:${channelId}`).emit('collaboration:user_left', {
          userId: socket.userId,
          channelId
        });
      });

      // Handle presence updates
      socket.on('presence:update', async (data: any) => {
        try {
          const adminClient = createAdminClient();
          await adminClient
            .from('user_presence')
            .upsert({
              user_id: socket.userId,
              clinic_id: socket.clinicId,
              status: data.status || 'online',
              last_seen: new Date().toISOString(),
              metadata: data.metadata || {}
            });

          // Broadcast presence to relevant users
          if (socket.clinicId) {
            io.to(`clinic:${socket.clinicId}`).emit('presence:update', {
              userId: socket.userId,
              status: data.status || 'online',
              lastSeen: new Date().toISOString()
            });
          }
        } catch (error) {
          ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.userId}`);
        
        try {
          // Update presence to offline
          const adminClient = createAdminClient();
          await adminClient
            .from('user_presence')
            .upsert({
              user_id: socket.userId,
              clinic_id: socket.clinicId,
              status: 'offline',
              last_seen: new Date().toISOString()
            });

          // Notify others
          if (socket.clinicId) {
            io.to(`clinic:${socket.clinicId}`).emit('presence:update', {
              userId: socket.userId,
              status: 'offline',
              lastSeen: new Date().toISOString()
            });
          }
        } catch (error) {
          ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
        }
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default SocketHandler;
