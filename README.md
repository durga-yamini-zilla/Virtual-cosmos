# Virtual Cosmos 🚀

A real-time, 2D multiplayer "proximity chat" application. Walk around a digital cosmos, find other users, and chat—but only if you're close enough to "hear" them!

## 🌟 Core Features

-   **Proximity-Based Chat**: Messages are only delivered to users within a specific radius (150px).
-   **Expansive World**: A 3000x3000px grid to explore.
-   **Dynamic Camera**: The viewport follows your avatar as you move.
-   **Minimap**: A real-time overview of the entire cosmos, showing all users and your current viewport.
-   **Real-Time Sync**: Smooth 60FPS movement and instant messaging powered by Socket.IO and PixiJS.
-   **Immersive UI**: Beautiful animations with Framer Motion and procedural audio notifications.

---

## 🛠️ Tech Stack

### Frontend
-   **React**: UI components and state management.
-   **PixiJS**: High-performance 2D engine for rendering the world and avatars.
-   **Tailwind CSS**: Modern, utility-first styling.
-   **Framer Motion**: Smooth UI transitions and animations.
-   **Socket.IO Client**: Real-time communication with the server.

### Backend
-   **Node.js & Express**: Server environment and static file hosting.
-   **Socket.IO**: Bidirectional, low-latency communication.
-   **TypeScript**: Type-safe development across the entire stack.

---

## 🚀 Setup and Quickstart

Follow these steps to get Virtual Cosmos running locally.

### Prerequisites
-   **Node.js**: Version 18 or higher.
-   **npm**: Version 9 or higher.
-   **pnpm**: Required for installing dependencies. Install it globally via `npm install -g pnpm`.

### 1. Installation
Clone the repository and install dependencies:
```bash
pnpm install
```

### 2. Development Mode
Start the full-stack application (Express server + Vite frontend):
```bash
pnpm run dev
```
-   Open your browser to `http://localhost:3000`.
-   Enter your name and click "Enter Cosmos".
-   **Test Multiplayer**: Open `http://localhost:3000` in a second window or incognito tab to see both avatars!

### 3. Production Build
To build and run for production:
```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

---

## 🧠 How It Works

### Proximity Logic
The server uses the **Pythagorean Theorem** ($a^2 + b^2 = c^2$) to calculate the distance between users. When a message is sent, the server only "broadcasts" it to users within the `RADIUS` (150px).

### The Camera & World
The world is a large 3000x3000px coordinate system. The frontend uses a "Camera Follow" system that keeps your avatar centered by moving the world container in the opposite direction of your movement.

### The Minimap
The minimap scales the entire 3000px world down to a 160px box. It draws:
1.  All users as small dots.
2.  Your current viewport as a blue rectangle, showing exactly what part of the cosmos you are seeing.

---

## 📂 Project Structure

-   `server.ts`: The Express/Socket.IO backend logic.
-   `src/components/Cosmos.tsx`: The main PixiJS rendering engine.
-   `src/components/Minimap.tsx`: The logic for the world overview.
-   `src/components/Chat.tsx`: Proximity-based chat UI.
-   `src/constants.ts`: Shared settings (World size, hearing radius).

---
