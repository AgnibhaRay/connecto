# Connecto 🌐

A modern, feature-rich social media platform built with Next.js 15, Firebase, and TypeScript. Connecto provides users with an Instagram-inspired experience including posts, stories, real-time chat, events, and more.

![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black)
![React](https://img.shields.io/badge/React-19.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Firebase](https://img.shields.io/badge/Firebase-11.6.1-orange)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC)

## ✨ Features
    
### 📱 Core Social Features
- **Feed System**: Create, view, and interact with posts (text, images, and videos)
- **Double-Tap to Like**: Instagram-style double-tap gesture with heart animation
- **Comments & Interactions**: Real-time commenting, liking, and post engagement
- **Stories**: Create and view 24-hour ephemeral stories
- **User Profiles**: Customizable profiles with follow/follower system
- **User Search**: Find and connect with other users

### 💬 Communication
- **Real-Time Chat**: One-on-one messaging with Firebase real-time updates
- **Chat List**: View all conversations with latest message previews

### 📅 Events
- **Event Creation**: Create and manage social events
- **Event Discovery**: Browse and join events created by others
- **Event Details**: View comprehensive event information

### 🛡️ Moderation & Administration
- **Admin Dashboard**: User management and platform oversight
- **User Verification**: Blue checkmark verification system
- **Activity Logging**: Track important user activities
- **Content Moderation**: Tools for managing user-generated content

### 🎨 Media & File Handling
- **Image Upload**: Support for standard image formats
- **HEIC Conversion**: Automatic conversion of HEIC images to web-compatible formats
- **Video Support**: Upload and play video content
- **Optimized Loading**: Next.js Image optimization and lazy loading

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ 
- npm, yarn, or pnpm
- Firebase account and project

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AgnibhaRay/connecto.git
cd connecto
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up Firebase**

Create a `.env.local` file in the root directory with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. **Set up Firestore Rules**

Deploy the Firestore security rules from `firestore.rules`:
```bash
firebase deploy --only firestore:rules
```

5. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
connecto/
├── app/                      # Next.js App Router
│   ├── (admin)/             # Admin-only routes
│   ├── (auth)/              # Authentication routes
│   ├── (main)/              # Main app routes
│   │   ├── chat/           # Chat feature
│   │   ├── events/         # Events feature
│   │   ├── feed/           # Main feed
│   │   ├── posts/          # Post details & editing
│   │   └── profile/        # User profiles
│   └── api/                # API routes
├── components/              # React components
│   ├── admin/              # Admin components
│   ├── auth/               # Authentication components
│   ├── chat/               # Chat components
│   ├── events/             # Event components
│   ├── feed/               # Feed components
│   ├── profile/            # Profile components
│   ├── shared/             # Shared/common components
│   └── stories/            # Stories components
├── lib/                    # Utility libraries
│   ├── firebase/          # Firebase configuration
│   └── utils/             # Helper functions
├── types/                  # TypeScript type definitions
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router & Turbopack
- **UI Library**: React 19
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 4
- **Icons**: Heroicons 2
- **UI Components**: Headless UI

### Backend & Services
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Storage**: Firebase Storage
- **Real-time**: Firebase Realtime Database
- **Notifications**: React Hot Toast

### Development Tools
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Package Manager**: npm/yarn/pnpm
- **Version Control**: Git

## 🎯 Key Features Implementation

### Double-Tap to Like
Posts support Instagram-style double-tap gestures to like content:
- Desktop: Double-click on post images
- Mobile: Double-tap on post images
- Visual feedback with animated heart icon
- Automatic like state synchronization with Firebase

### Real-Time Updates
All social interactions update in real-time using Firebase:
- Live comment threads
- Instant like counts
- Real-time chat messages
- Story updates

### Admin Controls
Administrators have access to:
- User verification management
- Activity monitoring dashboard
- Content moderation tools
- User management interface

## 📝 Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## 🔐 Firebase Collections

### Core Collections
- `users` - User profiles and metadata
- `posts` - Social media posts with images/videos
- `comments` - Post comments
- `stories` - Ephemeral 24-hour stories
- `chats` - Chat conversations
- `messages` - Chat messages
- `events` - Social events
- `notifications` - User notifications
- `activity` - Activity logs for moderation

## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy!

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## 📱 Features Roadmap

- [ ] Push notifications
- [ ] Video calling
- [ ] Group chats
- [ ] Post scheduling
- [ ] Advanced analytics
- [ ] Story highlights
- [ ] Direct message reactions
- [ ] Poll creation
- [ ] Live streaming

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👤 Author

**Agnibha Ray**
- GitHub: [@AgnibhaRay](https://github.com/AgnibhaRay)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Firebase for backend infrastructure
- Heroicons for beautiful icons
- Vercel for hosting solutions

---

Built with ❤️ using Next.js and Firebase
