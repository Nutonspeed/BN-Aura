// Custom Next.js Server with Socket.IO for BN-Aura
// Required for real-time WebSocket functionality in production

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
// Import will be handled dynamically due to ES modules

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let io;

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // Handle Socket.IO requests
      if (parsedUrl.pathname === '/api/socket/io') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Socket.IO server running');
        return;
      }

      // Handle all other requests with Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO server
  io = new SocketIOServer(httpServer, {
    path: '/api/socket/io',
    cors: {
      origin: dev 
        ? ['http://localhost:3000'] 
        : ['https://bnaura.com', 'https://royeyoxaaieipdajijni.supabase.co'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // For now, skip detailed auth validation and allow connection
      // TODO: Implement proper auth validation with dynamic imports
      socket.userId = 'test-user';
      socket.clinicId = 'test-clinic';
      socket.role = 'clinic_admin';
      
      next();
    } catch (error) {
      console.error('Socket.IO auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
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
    socket.on('analytics:event', async (event) => {
      try {
        // Add user context
        event.userId = socket.userId;
        event.clinicId = socket.clinicId;
        event.timestamp = new Date().toISOString();

        // For now, just log analytics events (DB insertion will be handled by API routes)
        console.log(`📊 Analytics event: ${event.category}/${event.action}`);

        // Broadcast to admin dashboard if relevant
        if (['super_admin', 'clinic_admin'].includes(socket.role)) {
          io.to(`role:super_admin`).emit('analytics:update', event);
          if (socket.clinicId) {
            io.to(`clinic:${socket.clinicId}`).emit('analytics:update', event);
          }
        }
      } catch (error) {
        console.error('❌ Analytics event error:', error);
      }
    });

    // Handle notifications
    socket.on('notification:send', async (data) => {
      try {
        // Send to specific users
        if (data.targetUsers) {
          data.targetUsers.forEach(userId => {
            io.to(`user:${userId}`).emit('notification', { data: data.notification });
          });
        }

        // Send to specific roles
        if (data.targetRoles) {
          data.targetRoles.forEach(role => {
            io.to(`role:${role}`).emit('notification', { data: data.notification });
          });
        }

        // Send to specific clinics
        if (data.targetClinics) {
          data.targetClinics.forEach(clinicId => {
            io.to(`clinic:${clinicId}`).emit('notification', { data: data.notification });
          });
        }
      } catch (error) {
        console.error('❌ Notification send error:', error);
      }
    });

    // Handle subscription requests
    socket.on('subscribe:notifications', (filters) => {
      try {
        const rooms = [];
        
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
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.userId} (${reason})`);
      
      // Broadcast offline status
      socket.broadcast.emit('presence:update', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date().toISOString()
      });
    });
  });

  // Start the server
  httpServer
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 BN-Aura server ready on http://${hostname}:${port}`);
      console.log(`🔗 Socket.IO ready on path: /api/socket/io`);
    });
});
