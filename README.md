# BeatMux

A collaborative browser-based music production studio.

## Project Structure
- `client/`: React frontend (Vite)
- `server/`: Node.js backend (Express)

## Running Locally

1. **Database:**
   Ensure MongoDB is running locally on port 27017, or configure `MONGO_URI` in `server/.env`.

2. **Backend:**
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Frontend:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Development
- Frontend runs on `http://localhost:5173`
- Backend API runs on `http://localhost:3000`
