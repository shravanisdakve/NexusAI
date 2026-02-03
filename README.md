# NexusAI

NexusAI is a powerful, full-stack AI-integrated web application designed to leverage the capabilities of Google's Gemini models. It creates a seamless interaction between users and AI services, wrapped in a modern React-based user interface.

## 🚀 Project Overview

The project is structured as a monorepo containing both the frontend and backend:

*   **Frontend:** A high-performance React application built with TypeScript and Vite, featuring real-time capabilities and a modern UI using Framer Motion and Lucide React.
*   **Backend:** A robust Node.js/Express server handling API requests, authentication (JWT), database operations (MongoDB), and WebSocket connections (Socket.io).

## 🛠 Tech Stack

*   **Frontend:** React, TypeScript, Vite, Framer Motion, Axios, Socket.io-client
*   **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.io, Google Generative AI SDK, JWT, BcryptJS

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)
*   A MongoDB Atlas account or a local MongoDB installation.

## ⚙️ Installation & Setup

### 1. clone the repository
```bash
git clone <repository-url>
cd NexusAI
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/nexusai

# Security
JWT_SECRET=your_jwt_secret_key_here

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key

# Email Services (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
```

Start the backend server:

```bash
# Production start
npm start

# Development mode (with nodemon)
npm run dev
```

### 3. Frontend Setup
Navigate back to the project root (NexusAI folder) and install dependencies:

```bash
cd ..
npm install
```

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GEMINI_API_KEY=your_google_gemini_api_key
```

Start the frontend development server:

```bash
npm run dev
```

Visit `http://localhost:5173` to view the application.

## 📝 Scripts

**Root (Frontend)**
*   `npm run dev`: Starts the Vite development server.
*   `npm run build`: Builds the app for production.
*   `npm run preview`: Locally preview the production build.

**Backend**
*   `npm start`: Runs the server using node.
*   `npm run dev`: Runs the server using nodemon for hot-reloading.

## 🔒 Security Note
*   Never commit your `.env` files to version control.
*   Ensure your `JWT_SECRET` is complex and secure in a production environment.
