# Changelog

All notable changes to Quibly will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-08

### 🎉 Initial Release

#### Added
- **Real-time Messaging**
  - Instant messaging with Socket.IO
  - Message reactions and replies
  - Message editing and deletion
  - File attachments support
  - Link previews with rich embeds
  - Message pinning
  - Typing indicators

- **Voice & Video Communication**
  - High-quality voice calls via LiveKit
  - Video calling support
  - Screen sharing
  - Voice channels
  - Persistent voice rooms
  - Voice activity detection

- **Server Management**
  - Create and manage multiple servers
  - Channel organization (text, voice, announcement, rules)
  - Role-based permission system
  - Server customization (icon, banner, description)
  - Server discovery with interest-based matching
  - Vanity URLs for servers
  - Server templates for quick setup

- **User Features**
  - User authentication (email/password + Google OAuth)
  - Email verification system
  - Password reset functionality
  - Customizable user profiles
  - Avatar and banner uploads
  - Custom status and activities
  - Rich presence system
  - User badges and achievements
  - Privacy settings

- **Social Features**
  - Friend system (send/accept/block)
  - Direct messages (DMs)
  - Group DMs
  - User blocking
  - Interest-based user matching

- **Moderation & Safety**
  - Auto-moderation system
  - Banned words filtering
  - Member timeout/ban functionality
  - Audit logs for server actions
  - Member screening with custom questions
  - Welcome screens
  - Verification levels

- **Advanced Features**
  - Server analytics dashboard
  - Activity tracking
  - Message search
  - Notification system
  - Invite system with expiration
  - Server interests and hashtags
  - Multi-language support ready

- **Infrastructure**
  - Docker containerization
  - Multi-server architecture with load balancing
  - Kafka message queue for scalability
  - Redis caching and session management
  - PostgreSQL database with Prisma ORM
  - Cloudinary integration for file storage
  - Email service integration

#### Technical Stack
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, TypeScript
- **Backend:** Express.js, Bun runtime, Socket.IO
- **Database:** PostgreSQL with Prisma ORM
- **Real-time:** Socket.IO with Redis adapter
- **Voice/Video:** LiveKit
- **Message Queue:** Apache Kafka
- **Cache:** Redis
- **Storage:** Cloudinary
- **Deployment:** Docker, Docker Compose, Nginx

#### Performance
- Optimized message delivery with batch writes
- Efficient database queries with proper indexing
- Redis caching for frequently accessed data
- Kafka for horizontal scaling
- Load balancing support for multiple servers

#### Security
- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting ready
- Input validation and sanitization
- Secure file upload handling

---

## [Unreleased]

### Planned for v1.1.0
- Mobile app support (React Native)
- Advanced search with filters
- Message threads
- Video streaming capabilities
- Bot integration API
- Enhanced analytics dashboard
- Voice channel recording
- Custom emoji support
- Server boosting system
- Scheduled messages
- Message templates
- Advanced notification controls

### Under Consideration
- End-to-end encryption for DMs
- Voice message support
- Polls and surveys
- Event scheduling
- Integration marketplace
- Custom themes marketplace
- Server insights and growth tools
- Advanced moderation AI
- Multi-factor authentication
- SSO integration

---

## Version History

- **1.0.0** (2026-02-08) - Initial production release

---

For more details about each release, visit our [GitHub Releases](https://github.com/yourusername/quibly/releases) page.
