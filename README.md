# 🚀 Quibly - Real-time Communication Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/quibly)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.md)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Bun](https://img.shields.io/badge/bun-%3E%3D1.0.0-orange.svg)](https://bun.sh)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black.svg)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.3-blue.svg)](https://react.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A modern, feature-rich communication platform for building vibrant communities. Connect through real-time messaging, crystal-clear voice/video calls, and powerful server management tools.

**Current Version:** 1.0.0  
**Release Date:** February 2026  
**Status:** Production Ready

## ✨ Features

### 🎯 Core Features
- **Real-time Messaging** - Instant messaging with Socket.IO
- **Voice & Video Calls** - High-quality voice/video using LiveKit
- **Server Management** - Create and manage multiple servers with channels
- **Direct Messages** - Private conversations between users
- **Friend System** - Send/accept friend requests and manage friendships
- **Rich Presence** - Custom status, activities, and user presence tracking
- **User Profiles** - Customizable profiles with avatars, banners, and bios

### 🛡️ Advanced Features
- **Auto Moderation** - Automated content filtering and moderation rules
- **Audit Logs** - Track all server actions and changes
- **Member Screening** - Custom questions for new members
- **Welcome Screens** - Customizable welcome experience
- **Role Management** - Granular permission system with roles
- **Server Analytics** - Track server growth and engagement
- **Link Previews** - Rich embeds for shared links
- **Message Reactions** - React to messages with emojis
- **File Uploads** - Share images and files via Cloudinary
- **Server Templates** - Quick server setup with pre-configured templates

### 🎨 User Experience
- **Custom Themes** - Personalize your experience
- **Status & Activities** - Show what you're doing
- **Interest-based Discovery** - Find servers based on interests
- **Responsive Design** - Works seamlessly on all devices
- **Dark/Light Mode** - Eye-friendly interface options

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Real-time**: Socket.IO Client
- **Voice/Video**: LiveKit React Components
- **UI Components**: Radix UI
- **Forms**: React Hook Form
- **Authentication**: Google OAuth

### Backend
- **Runtime**: Bun
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO with Redis Adapter
- **Message Queue**: Apache Kafka
- **Caching**: Redis
- **Voice/Video**: LiveKit Server SDK
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Authentication**: JWT + bcrypt

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Load Balancing**: Nginx (multi-server support)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Message Broker**: Apache Kafka + Zookeeper

## 📋 Prerequisites

- **Node.js** 18+ or **Bun** 1.0+
- **Docker** & **Docker Compose**
- **PostgreSQL** 14+
- **Redis** 7+
- **Kafka** 3.0+

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd quibly
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
bun install
# or
npm install

# Copy environment file
cp .env.example .env

# Configure your .env file with:
# - Database credentials
# - Redis URL
# - Kafka brokers
# - LiveKit credentials
# - Cloudinary credentials
# - Email service credentials
# - JWT secret

# Start infrastructure services
npm run docker:up

# Run database migrations
npx prisma migrate deploy

# Seed the database (optional)
npx prisma db seed

# Start the backend server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
bun install
# or
npm install

# Copy environment file
cp .env.example .env

# Configure your .env file with:
# - Backend API URL
# - Socket.IO URL
# - LiveKit credentials
# - Google OAuth credentials

# Start the development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Socket.IO**: ws://localhost:5000

## 🐳 Docker Deployment

The project includes Docker support for easy deployment:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Clean up volumes
docker-compose down -v
```



## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/quibly
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=your-secret-key
LIVEKIT_API_KEY=your-livekit-key
LIVEKIT_API_SECRET=your-livekit-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## 🎯 Key Features Implementation

### Real-time Messaging
- Socket.IO for bidirectional communication
- Redis adapter for horizontal scaling
- Kafka for message persistence and fanout
- Batch database writes for performance

### Voice & Video Calls
- LiveKit integration for WebRTC
- Room management and participant tracking
- Screen sharing support
- Voice channel persistence

### Scalability
- Multi-server architecture with load balancing
- Redis for session management and caching
- Kafka for event streaming
- Horizontal scaling support

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset

### Servers
- `GET /api/servers` - Get user's servers
- `POST /api/servers` - Create new server
- `GET /api/servers/:id` - Get server details
- `PATCH /api/servers/:id` - Update server
- `DELETE /api/servers/:id` - Delete server

### Channels
- `GET /api/servers/:serverId/channels` - Get server channels
- `POST /api/servers/:serverId/channels` - Create channel
- `PATCH /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel

### Messages
- `GET /api/channels/:channelId/messages` - Get messages
- `POST /api/channels/:channelId/messages` - Send message
- `PATCH /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 📊 Version History

### v1.0.0 (February 2026) - Initial Release
- ✅ Real-time messaging with Socket.IO
- ✅ Voice & video calls with LiveKit
- ✅ Server and channel management
- ✅ User authentication & profiles
- ✅ Friend system & DMs
- ✅ Auto-moderation & audit logs
- ✅ Member screening & welcome screens
- ✅ Rich presence & activities
- ✅ File uploads & link previews
- ✅ Server templates & analytics
- ✅ Docker deployment support
- ✅ Multi-server load balancing

### Upcoming Features (v1.1.0)
- 🔄 Mobile app support
- 🔄 Advanced search functionality
- 🔄 Message threads
- 🔄 Video streaming
- 🔄 Bot integration API
- 🔄 Enhanced analytics dashboard

## 🙏 Acknowledgments

- [LiveKit](https://livekit.io) for voice/video infrastructure
- [Socket.IO](https://socket.io) for real-time communication
- [Prisma](https://prisma.io) for database management
- [Next.js](https://nextjs.org) for the frontend framework
- [Apache Kafka](https://kafka.apache.org) for event streaming


## 🌟 Star History

If you find Quibly useful, please consider giving it a star ⭐ on GitHub!

## 📈 Project Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/quibly?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/quibly?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/quibly?style=social)

---

**Built with ❤️ using modern web technologies**

*Quibly - Where communities come alive* 🚀
