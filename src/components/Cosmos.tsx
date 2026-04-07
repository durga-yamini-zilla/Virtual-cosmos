import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { User } from '../types';
import { WORLD_SIZE } from '../constants';

interface CosmosProps {
  me: User;
  users: User[];
  onMove: (x: number, y: number) => void;
  onViewportChange: (width: number, height: number, cameraX: number, cameraY: number) => void;
  radius: number;
}

/**
 * COSMOS COMPONENT
 * This component uses PixiJS to render the 2D virtual world.
 * It handles the graphics, the animation loop, and keyboard input.
 */
export default function Cosmos({ me, users, onMove, onViewportChange, radius }: CosmosProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const worldRef = useRef<PIXI.Container | null>(null);
  const usersMapRef = useRef<Map<string, PIXI.Container>>(new Map());
  const meContainerRef = useRef<PIXI.Container | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const requestRef = useRef<number>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };

    const initPixi = async () => {
      const app = new PIXI.Application({
        resizeTo: containerRef.current!,
        backgroundColor: 0x111827,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      containerRef.current!.appendChild(app.view as any);
      appRef.current = app;

      // Create a world container to hold all game objects
      const world = new PIXI.Container();
      app.stage.addChild(world);
      worldRef.current = world;

      // Draw grid background for the entire world
      const grid = new PIXI.Graphics();
      grid.lineStyle(1, 0x1f2937, 0.5);
      for (let i = 0; i <= WORLD_SIZE; i += 50) {
        grid.moveTo(i, 0).lineTo(i, WORLD_SIZE);
        grid.moveTo(0, i).lineTo(WORLD_SIZE, i);
      }
      world.addChild(grid);

      // Create my avatar
      const meContainer = createAvatar(me, true, radius);
      meContainer.x = me.x;
      meContainer.y = me.y;
      world.addChild(meContainer);
      meContainerRef.current = meContainer;

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      const speed = 5;
      const update = () => {
        let dx = 0;
        let dy = 0;
        
        if (keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W']) dy -= speed;
        if (keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S']) dy += speed;
        if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) dx -= speed;
        if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) dx += speed;

        if (dx !== 0 || dy !== 0) {
          if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / length) * speed;
            dy = (dy / length) * speed;
          }

          // Move relative to WORLD_SIZE
          const newX = Math.max(20, Math.min(WORLD_SIZE - 20, meContainer.x + dx));
          const newY = Math.max(20, Math.min(WORLD_SIZE - 20, meContainer.y + dy));

          if (newX !== meContainer.x || newY !== meContainer.y) {
            meContainer.x = newX;
            meContainer.y = newY;
            onMove(newX, newY);
          }
        }

        // Camera follow logic
        // We want the player to stay in the center of the screen.
        // We calculate where the top-left corner of the "camera" should be.
        let camX = meContainer.x - app.screen.width / 2;
        let camY = meContainer.y - app.screen.height / 2;
        
        // Clamp camera so it doesn't show the empty space outside the 3000x3000px world
        camX = Math.max(0, Math.min(WORLD_SIZE - app.screen.width, camX));
        camY = Math.max(0, Math.min(WORLD_SIZE - app.screen.height, camY));

        // Instead of moving the camera (which Pixi doesn't have a built-in one for easily),
        // we move the entire "world" container in the opposite direction.
        // This creates the illusion of a camera following the player.
        world.x = -camX;
        world.y = -camY;

        // Report viewport info to parent for minimap
        // This tells the Minimap where the screen is relative to the 3000x3000px world.
        onViewportChange(app.screen.width, app.screen.height, camX, camY);

        requestRef.current = requestAnimationFrame(update);
      };
      requestRef.current = requestAnimationFrame(update);
    };

    initPixi();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
      }
    };
  }, []);

  useEffect(() => {
    if (!worldRef.current) return;
    const world = worldRef.current;
    
    const currentIds = new Set(users.map(u => u.id));
    for (const [id, container] of usersMapRef.current.entries()) {
      if (!currentIds.has(id)) {
        world.removeChild(container);
        container.destroy();
        usersMapRef.current.delete(id);
      }
    }

    users.forEach(user => {
      let container = usersMapRef.current.get(user.id);
      if (!container) {
        container = createAvatar(user, false, radius);
        world.addChild(container);
        usersMapRef.current.set(user.id, container);
      }
      
      container.x = user.x;
      container.y = user.y;

      const dx = user.x - me.x;
      const dy = user.y - me.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const isNear = distance <= radius;
      
      const ring = container.getChildByName('ring') as PIXI.Graphics;
      if (ring) {
        ring.alpha = isNear ? 1 : 0;
      }
    });
  }, [users, me.x, me.y, radius]);

  return <div ref={containerRef} className="w-full h-full" />;
}

function createAvatar(user: User, isMe: boolean, radius: number): PIXI.Container {
  const container = new PIXI.Container();
  
  const ring = new PIXI.Graphics();
  ring.name = 'ring';
  ring.lineStyle(2, PIXI.utils.string2hex(user.color), 0.3);
  ring.drawCircle(0, 0, radius);
  ring.alpha = isMe ? 1 : 0;
  container.addChild(ring);

  const circle = new PIXI.Graphics();
  circle.beginFill(PIXI.utils.string2hex(user.color));
  circle.drawCircle(0, 0, 20);
  circle.endFill();
  
  if (isMe) {
    circle.lineStyle(3, 0xffffff);
    circle.drawCircle(0, 0, 20);
  }
  container.addChild(circle);

  const text = new PIXI.Text(user.name + (isMe ? ' (You)' : ''), {
    fontFamily: 'Arial',
    fontSize: 14,
    fill: 0xffffff,
    align: 'center',
    fontWeight: isMe ? 'bold' : 'normal',
  });
  text.anchor.set(0.5);
  text.y = 30;
  
  const textBg = new PIXI.Graphics();
  textBg.beginFill(0x000000, 0.6);
  textBg.drawRoundedRect(-text.width/2 - 4, 22, text.width + 8, 16, 4);
  textBg.endFill();
  
  container.addChild(textBg);
  container.addChild(text);

  return container;
}
