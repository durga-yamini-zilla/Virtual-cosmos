/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Cosmos from './components/Cosmos';
import Chat from './components/Chat';
import Minimap from './components/Minimap';
import UserList from './components/UserList';
import { User, Message } from './types';
import { RADIUS, WORLD_SIZE } from './constants';
import { Users, Map as MapIcon, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  /**
   * STATE MANAGEMENT
   */
  const [socket, setSocket] = useState<Socket | null>(null);
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState('');
  const [me, setMe] = useState<User | null>(null);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [messages, setMessages] = useState<Message[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<User[]>([]);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const [viewport, setViewport] = useState({ width: 0, height: 0, camX: 0, camY: 0 });
  
  // Audio context for notification sound
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * SOUND NOTIFICATION
   * This function uses the Web Audio API to generate a sound without external files.
   * It creates an oscillator (sound wave generator) and a gain node (volume control).
   */
  const playNotificationSound = useCallback(() => {
    if (isMuted) return; // Don't play if the user has muted notifications
    
    try {
      // Create the audio context if it doesn't exist yet
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      // Browsers often suspend audio until the user interacts with the page
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // We use a sine wave for a clean, bell-like tone
      oscillator.type = 'sine';
      // Start at a high frequency and slide down quickly (a "ping" effect)
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // A4 note
      
      // Fade out the volume so it doesn't click at the end
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error('Failed to play sound:', e);
    }
  }, [isMuted]);

  /**
   * INITIALIZATION
   */
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('init', (initialUsers: User[]) => {
      const usersMap = new Map<string, User>();
      initialUsers.forEach(u => {
        if (u.id !== newSocket.id) usersMap.set(u.id, u);
      });
      setUsers(usersMap);
    });

    newSocket.on('userJoined', (user: User) => {
      setUsers((prev: Map<string, User>) => {
        const next = new Map(prev);
        next.set(user.id, user);
        return next;
      });
    });

    newSocket.on('userMoved', ({ id, x, y }) => {
      setUsers((prev: Map<string, User>) => {
        const next = new Map<string, User>(prev);
        const user = next.get(id);
        if (user) {
          const updatedUser: User = { ...user, x, y };
          next.set(id, updatedUser);
        }
        return next;
      });
    });

    newSocket.on('userLeft', (id: string) => {
      setUsers((prev: Map<string, User>) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    });

    newSocket.on('receiveMessage', (message: Message) => {
      setMessages((prev: Message[]) => [...prev, message]);
      // Play sound if message is not from me
      if (message.senderId !== newSocket.id) {
        playNotificationSound();
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [playNotificationSound]);

  /**
   * PROXIMITY DETECTION
   */
  useEffect(() => {
    if (!me) return;
    const nearby: User[] = [];
    
    users.forEach((user: User) => {
      const dx = user.x - me.x;
      const dy = user.y - me.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= RADIUS) {
        nearby.push(user);
      }
    });
    
    setNearbyUsers(nearby);
  }, [me, users]);

  /**
   * HANDLERS
   */
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !socket) return;

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const startX = Math.random() * (WORLD_SIZE - 400) + 200;
    const startY = Math.random() * (WORLD_SIZE - 400) + 200;

    const myUser = { id: socket.id!, name, color, x: startX, y: startY };
    setMe(myUser);
    
    socket.emit('join', myUser);
    setJoined(true);
  };

  const handleMove = (x: number, y: number) => {
    if (!me || !socket) return;
    setMe((prev: User | null) => prev ? { ...prev, x, y } : null);
    socket.emit('move', { x, y });
  };

  const handleSendMessage = (text: string) => {
    if (!socket) return;
    socket.emit('sendMessage', { text });
  };

  const handleViewportChange = useCallback((width: number, height: number, camX: number, camY: number) => {
    setViewport({ width, height, camX, camY });
  }, []);

  /**
   * RENDERING
   */
  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col gap-6 w-full max-w-md relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600" />
          
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-br from-white to-gray-500 mb-2">
              VIRTUAL COSMOS
            </h1>
            <p className="text-gray-500 text-sm">A proximity-based social experiment</p>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Your Identity</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 mt-4"
                placeholder="Enter your name..."
                required
                maxLength={15}
                autoFocus
              />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              Enter the Void
            </motion.button>
          </form>

          <div className="flex items-center gap-4 text-[10px] text-gray-600 uppercase tracking-widest justify-center mt-4">
            <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-blue-500" /> Real-time</div>
            <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-purple-500" /> Proximity</div>
            <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-pink-500" /> WebGL</div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden font-sans text-gray-200">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 p-4 flex justify-between items-center z-30 sticky top-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <MapIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-black tracking-tighter text-white">COSMOS</h1>
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-950 px-3 py-1.5 rounded-full border border-gray-800">
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Coordinates</span>
              <span className="text-xs font-mono text-blue-400">{Math.round(me?.x || 0)}, {Math.round(me?.y || 0)}</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-950 px-3 py-1.5 rounded-full border border-gray-800">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-xs font-bold text-gray-300">{users.size + 1} Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsUserListOpen(true)}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-all border border-gray-700/50 relative"
          >
            <Users size={20} />
            {users.size > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-gray-900">
                {users.size}
              </span>
            )}
          </button>
          
          <div className="h-8 w-px bg-gray-800 mx-1" />
          
          <div className="flex items-center gap-3 bg-gray-800/50 pl-1 pr-3 py-1 rounded-xl border border-gray-700/50">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md"
              style={{ backgroundColor: me?.color }}
            >
              {me?.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-white">{me?.name}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 relative flex overflow-hidden">
        {/* Main World Area */}
        <div className="flex-1 relative bg-gray-950">
          <Cosmos 
            me={me!} 
            users={Array.from(users.values())} 
            onMove={handleMove}
            onViewportChange={handleViewportChange}
            radius={RADIUS}
          />
          
          {/* Floating HUD */}
          <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-gray-900/80 backdrop-blur-md border border-gray-800 p-4 rounded-2xl shadow-2xl w-50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-400" />
                <p className="text-xs font-bold text-white uppercase tracking-widest">Navigation</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">Movement</span>
                  <span className="text-gray-300 font-medium">WASD / Arrows</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">Communication</span>
                  <span className="text-gray-300 font-medium">Proximity Based</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">Range</span>
                  <span className="text-blue-400 font-bold">{RADIUS}px</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Minimap */}
          <Minimap 
            me={me!} 
            users={Array.from(users.values())}
            viewportWidth={viewport.width}
            viewportHeight={viewport.height}
            cameraX={viewport.camX}
            cameraY={viewport.camY}
          />
        </div>

        {/* User List Sidebar (Toggleable) */}
        <UserList 
          users={Array.from(users.values())}
          me={me}
          isOpen={isUserListOpen}
          onClose={() => setIsUserListOpen(false)}
        />

        {/* Chat Panel */}
        <AnimatePresence>
          {nearbyUsers.length > 0 && (
            <motion.div 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
            >
              <Chat 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                meId={me?.id || ''}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
