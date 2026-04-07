import React from 'react';
import { User } from '../types';
import { Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserListProps {
  users: User[];
  me: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserList({ users, me, isOpen, onClose }: UserListProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
          
          {/* Sidebar Container */}
          {/* We use motion.div to animate the sidebar sliding in from the right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-72 bg-gray-900 border-l border-gray-800 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur-md sticky top-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-none">Cosmos Citizens</h2>
                  <p className="text-xs text-gray-500 mt-1">{users.length + (me ? 1 : 0)} online now</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {/* Current User */}
              {me && (
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-3 group">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-blue-500/20"
                    style={{ backgroundColor: me.color }}
                  >
                    {me.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{me.name}</p>
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-[10px] font-bold text-blue-400 rounded uppercase tracking-wider">You</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">Exploring the cosmos</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                </div>
              )}

              {/* Other Users */}
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="p-3 rounded-xl hover:bg-gray-800/50 border border-transparent hover:border-gray-800 flex items-center gap-3 transition-all duration-200 group"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">Active in Cosmos</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
              ))}

              {users.length === 0 && !me && (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-500 italic">The cosmos is empty...</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-900/80 border-t border-gray-800">
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Pro Tip</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Move your avatar close to others to start a conversation!
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
