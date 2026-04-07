import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, Volume2, VolumeX, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  meId: string;
  isMuted: boolean;
  onToggleMute: () => void;
}

/**
 * CHAT COMPONENT
 * This component handles the UI for the chat panel.
 * It shows the message history and a text input field.
 */
export default function Chat({ messages, onSendMessage, meId, isMuted, onToggleMute }: ChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * AUTO-SCROLL
   * This effect runs every time a new message is added to the list.
   * It ensures the newest messages are always visible by scrolling to the bottom.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * SUBMIT HANDLER
   * Triggered when the user presses Enter or clicks the Send button.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Send the text to the parent component (App.tsx)
    onSendMessage(input);
    // Clear the input field
    setInput('');
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-900 shadow-2xl">
      {/* 1. HEADER AREA */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-none">Nearby Chat</h2>
            <p className="text-xs text-gray-500 mt-1">Messages only reach those nearby</p>
          </div>
        </div>
        <button 
          onClick={onToggleMute}
          className={`p-2 rounded-full transition-all duration-200 ${
            isMuted ? 'bg-gray-800 text-gray-500 hover:text-gray-400' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
          }`}
          title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* 2. MESSAGE LIST AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-gray-500 text-sm text-center px-8 italic"
            >
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-700" />
              </div>
              <p>You are now connected to nearby users.</p>
              <p className="mt-1">Say something to start the conversation!</p>
            </motion.div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === meId;
              const isLastFromSameSender = index > 0 && messages[index - 1].senderId === msg.senderId;
              
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isLastFromSameSender ? '-mt-4' : ''}`}
                >
                  {/* Sender Name and Timestamp (only if not consecutive) */}
                  {!isLastFromSameSender && (
                    <div className={`flex items-baseline gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs font-bold tracking-wide uppercase" style={{ color: msg.senderColor }}>
                        {isMe ? 'You' : msg.senderName}
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`flex items-end gap-2 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && !isLastFromSameSender && (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md shrink-0 mb-1"
                        style={{ backgroundColor: msg.senderColor }}
                      >
                        {msg.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {(!isMe && isLastFromSameSender) && <div className="w-8 shrink-0" />}

                    <div 
                      className={`relative px-4 py-2.5 text-sm shadow-lg transition-all duration-200 group-hover:shadow-xl ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                          : 'bg-gray-800 text-gray-100 rounded-2xl rounded-tl-none border border-gray-700/50'
                      }`}
                      style={{ maxWidth: 'min(320px, 85%)' }}
                    >
                      <p className="leading-relaxed wrap-break-word">{msg.text}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      
      {/* 3. INPUT AREA */}
      <div className="p-4 bg-gray-900/80 border-t border-gray-800 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-600"
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-2xl p-3 w-12 h-12 flex items-center justify-center transition-all shadow-lg shadow-blue-600/20"
          >
            <Send size={20} className={input.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''} />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
