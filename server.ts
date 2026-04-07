import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import { RADIUS } from './src/constants';

/**
 * Main server startup function.
 * We use an async function because initializing Vite's dev server is asynchronous.
 */
async function startServer() {
  const app = express();
  
  // Create a standard Node.js HTTP server using the Express app.
  // This is required because Socket.IO needs to attach to a raw HTTP server.
  const server = http.createServer(app);
  
  // Initialize Socket.IO and allow connections from any origin (CORS).
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  const PORT = 3000;

  /**
   * IN-MEMORY USER STORAGE
   * We use a Map to store user data. 
   * Key: socket.id (unique string for each connection)
   * Value: Object with name, position (x, y), and color.
   */
  const users = new Map<string, { id: string, x: number, y: number, color: string, name: string }>();

  /**
   * SOCKET.IO EVENT HANDLERS
   * This block runs every time a new browser tab connects to our server.
   */
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    /**
     * JOIN EVENT
     * Triggered when a user enters their name on the frontend.
     */
    socket.on('join', (data: { name: string, color: string, x: number, y: number }) => {
      // Save the user's initial data in our Map.
      users.set(socket.id, {
        id: socket.id,
        x: data.x,
        y: data.y,
        color: data.color,
        name: data.name
      });
      
      // Send the list of ALL currently online users back to the person who just joined.
      socket.emit('init', Array.from(users.values()));
      
      // Tell everyone else that a new user has arrived.
      socket.broadcast.emit('userJoined', users.get(socket.id));
    });

    /**
     * MOVE EVENT
     * Triggered 60 times per second as the user moves their avatar.
     */
    socket.on('move', (data: { x: number, y: number }) => {
      const user = users.get(socket.id);
      if (user) {
        // Update the position in our memory.
        user.x = data.x;
        user.y = data.y;
        
        // Broadcast the new position to everyone else.
        // We use broadcast so the sender doesn't receive their own movement back.
        socket.broadcast.emit('userMoved', { id: socket.id, x: data.x, y: data.y });
      }
    });

    /**
     * SEND MESSAGE EVENT
     * Implements the proximity-based chat logic.
     * When a user sends a message, the server only forwards it to people nearby.
     */
    socket.on('sendMessage', (data: { text: string }) => {
      const sender = users.get(socket.id);
      if (!sender) return;

      // Create a message object with a unique ID and timestamp.
      const message = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: sender.id,
        senderName: sender.name,
        senderColor: sender.color,
        text: data.text,
        timestamp: Date.now()
      };

      // 1. Send the message back to the sender immediately.
      // This confirms to the sender that their message was processed.
      socket.emit('receiveMessage', message);

      /**
       * 2. PROXIMITY CHECK
       * Loop through all online users and calculate their distance from the sender.
       * We use the shared RADIUS constant to ensure consistency with the frontend.
       */
      for (const [id, user] of users.entries()) {
        if (id !== socket.id) {
          // Calculate distance using the Pythagorean Theorem: sqrt(dx^2 + dy^2)
          const dx = user.x - sender.x;
          const dy = user.y - sender.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only send the message if the user is within the interaction radius.
          if (distance <= RADIUS) {
            // Use io.to(id) to send the message to a specific user's socket.
            io.to(id).emit('receiveMessage', message);
          }
        }
      }
    });

    /**
     * DISCONNECT EVENT
     * Triggered when the user closes the tab or loses internet.
     */
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Remove them from our memory.
      users.delete(socket.id);
      // Tell everyone else to remove this avatar from their screen.
      io.emit('userLeft', socket.id);
    });
  });

  /**
   * VITE & STATIC FILE SERVING
   * This part ensures the React frontend is served correctly.
   */
  if (process.env.NODE_ENV !== 'production') {
    // In development, use Vite's middleware for hot-reloading.
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the pre-built static files from the 'dist' folder.
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start the server on port 3000.
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
