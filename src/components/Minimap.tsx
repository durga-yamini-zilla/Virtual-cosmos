import React from 'react';
import { User } from '../types';
import { WORLD_SIZE } from '../constants';

interface MinimapProps {
  me: User;
  users: User[];
  viewportWidth: number;
  viewportHeight: number;
  cameraX: number;
  cameraY: number;
}

/**
 * MINIMAP COMPONENT
 * This component shows a small overview of the entire Virtual Cosmos.
 * It displays the positions of all users and the current visible viewport.
 */
export default function Minimap({ me, users, viewportWidth, viewportHeight, cameraX, cameraY }: MinimapProps) {
  const size = 160; // Size of the minimap in pixels
  const scale = size / WORLD_SIZE;

  // Calculate the viewport rectangle on the minimap
  // We use a scale factor (minimap_size / world_size) to translate
  // large world coordinates into small minimap coordinates.
  const viewRect = {
    x: cameraX * scale,
    y: cameraY * scale,
    w: viewportWidth * scale,
    h: viewportHeight * scale
  };

  return (
    <div 
      className="absolute bottom-6 right-6 bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-xl overflow-hidden shadow-2xl z-20"
      style={{ width: size, height: size }}
    >
      {/* Grid background for the minimap */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#4b5563 1px, transparent 1px), linear-gradient(90deg, #4b5563 1px, transparent 1px)',
             backgroundSize: `${50 * scale}px ${50 * scale}px`
           }} 
      />

      {/* Viewport Rectangle (shows what you can see on screen) */}
      <div 
        className="absolute border border-blue-500/50 bg-blue-500/5 pointer-events-none transition-all duration-100"
        style={{ 
          left: viewRect.x, 
          top: viewRect.y, 
          width: Math.min(size, viewRect.w), 
          height: Math.min(size, viewRect.h) 
        }}
      />

      {/* Other Users (Small Dots) */}
      {users.map(user => (
        <div 
          key={user.id}
          className="absolute w-1.5 h-1.5 rounded-full border border-gray-900 shadow-sm transition-all duration-200"
          style={{ 
            left: user.x * scale - 3, 
            top: user.y * scale - 3,
            backgroundColor: user.color
          }}
          title={user.name}
        />
      ))}

      {/* Me (Glowing White Dot) */}
      <div 
        className="absolute w-2.5 h-2.5 bg-white rounded-full border-2 border-gray-900 z-10 shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-75"
        style={{ 
          left: me.x * scale - 5, 
          top: me.y * scale - 5
        }}
      />

      {/* World Bounds Label */}
      <div className="absolute bottom-1 right-1 text-[8px] text-gray-500 font-mono pointer-events-none">
        {WORLD_SIZE}x{WORLD_SIZE}
      </div>
    </div>
  );
}
