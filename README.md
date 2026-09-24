# BeatMux 🎵

> **🚀 Performance First:** Before diving into the features, we want to highlight that BeatMux is built for extreme scale. Our Node.js/Socket.IO backend was rigorously load-tested:
> - **AutoCannon HTTP Test:** Handled **~38,265 requests per second** (421k+ requests in 11s) with an average latency of just **2.12 ms**.
> - **WebSocket Capacity:** Successfully handled 100 concurrent users in a single room firing rapid actions, effortlessly broadcasting **~38,800 real-time state updates** with zero drops. 
> We are the best because our custom Web Audio API integration runs synchronously with real-time Socket.IO events, ensuring zero-latency multiplayer jamming without relying on bulky third-party audio libraries.

## 🔗 Live Deployment
Play now: **[beatmux.vercel.app](https://beatmux.vercel.app)**

## 📖 Introduction
BeatMux is a powerful real-time multiplayer drum sequencer and audio synthesis engine.

## 🌊 Application Flow
1. **Create/Join a Room:** Users enter a nickname and create a unique room or join an existing one using a 6-character code.
2. **Real-time Sync:** All connected collaborators appear in the sidebar. Chat with them using the integrated real-time messenger.
3. **Jamming:** Users plot notes on the step sequencer. Everything is synchronized instantly across all clients.
4. **Music Import:** Users can import their own background music. The audio timeline stretches globally, and playback pauses/resumes in perfect sync.
5. **Exporting:** Users can download their live mix by recording the master audio stream.

## 🛠️ Tech Stack
- React, Vite, Tailwind CSS
- Web Audio API (Raw AudioContext & Synthesis)
- Node.js, Express, Socket.IO

## 🚀 How to Run Locally

1. **Clone the repo**
2. **Start the Backend:**
   \`\`\`bash
   cd server
   npm install
   npm start
   \`\`\`
3. **Start the Frontend:**
   \`\`\`bash
   cd client
   npm install
   npm run dev
   \`\`\`
