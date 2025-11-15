# FitHub - Performance-Driven Gym Community

A modern React web app built to connect and empower the fitness community.

## Overview

FitHub is a performance-driven gym community platform designed to help users achieve their fitness goals through data tracking, social motivation, and professional trainer matching.
The project began as a hands-on exploration of React 18 and modern front-end development workflows, combining Cursor AI and Figma MCP for intelligent UI generation and rapid iteration.

This project demonstrates proficiency in React ecosystem architecture, component-driven design, and AI-assisted development — forming the foundation for future integration with a database-backed system for real-time data handling and user management.

## Tech Stack

<<<<<<< HEAD
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend as a Service (Database & Authentication)

=======
- **React 18** - UI component architecture
- **TypeScript** - Type safety and clean code structure
- **Vite** - Lightning-fast build and development server
- **Tailwind CSS** - Responsive and maintainable styling
- **Database integration (MongoDB / Firebase) is planned for future updates to enable user profiles, community posts, and workout tracking.
- 
>>>>>>> fa2b2b44a6c193bc858409557a6efc4d867580c7
## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Supabase account (free tier available)

### Frontend Installation

```bash
npm install
```

### Supabase Setup

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Get your API keys from **Settings** → **API**
4. Create the database table using the SQL in `SUPABASE_SETUP.md`
5. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

For detailed setup instructions, see `SUPABASE_SETUP.md` or `QUICK_START_SUPABASE.md`

### Frontend Development Server

In the root directory, start the frontend:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view it.

**Note**: Make sure you've set up Supabase and configured your `.env` file before using the sign-up feature.

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Structure

```
src/
 ├─ pages/
 │   ├─ Home.tsx
 │   ├─ Community.tsx
 │   ├─ PostDetail.tsx
 │   ├─ Profile.tsx
 │   ├─ WorkoutDashboard.tsx
 │   ├─ RoutineBuilder.tsx
 │   ├─ TrainerApplication.tsx
 │   ├─ AdminTrainerReview.tsx
 │   └─ SignIn.tsx / SignUp.tsx
 │
 ├─ components/
 │   ├─ layout/
 │   │    ├─ Header.tsx
 │   │    ├─ Footer.tsx
 │   │    └─ Sidebar.tsx (Dashboard용)
 │   │
 │   ├─ community/
 │   │    ├─ PostCard.tsx
 │   │    ├─ PostList.tsx
 │   │    ├─ Comment.tsx
 │   │    ├─ LikeButton.tsx
 │   │    ├─ NewPostForm.tsx
 │   │    └─ CommentList.tsx
 │   │
 │   ├─ profile/
 │   │    ├─ ProfileHeader.tsx
 │   │    ├─ ProfileImageUploader.tsx
 │   │    └─ ProfileStats.tsx
 │   │
 │   ├─ workout/
 │   │    ├─ RoutineCard.tsx
 │   │    ├─ RoutineEditor.tsx
 │   │    ├─ ExerciseInput.tsx
 │   │    └─ ProgressChart.tsx
 │   │
 │   ├─ trainer/
 │   │    ├─ TrainerBadge.tsx
 │   │    └─ TrainerRequestStatus.tsx
 │   │
 │   ├─ ui/
 │   │    ├─ Button.tsx
 │   │    ├─ Card.tsx
 │   │    ├─ Modal.tsx
 │   │    ├─ Avatar.tsx
 │   │    └─ Textarea.tsx
 │
 ├─ lib/
 │   ├─ supabase.ts
 │   ├─ auth.ts
 │   ├─ helpers.ts
 │   └─ validations.ts
 │
 ├─ hooks/
 │   ├─ useAuth.ts
 │   ├─ usePosts.ts
 │   ├─ useComments.ts
 │   └─ useRoutine.ts
 │
 └─ types/
      ├─ Post.ts
      ├─ User.ts
      ├─ Comment.ts
      └─ Routine.ts

```

<img width="988" height="809" alt="image" src="https://github.com/user-attachments/assets/6b9e7727-b5a6-4958-9caf-aa0b0a644524" />

## Project Status
This is an ongoing project currently under development.  
The next phase will include backend integration for user authentication, workout tracking, and community interaction.

## Key Features
- Fully responsive layout across all devices
- Modern design system built from Figma MCP
- User authentication with Supabase Auth
- Secure PostgreSQL database with Row Level Security (RLS)
- Complete user profile customization
- Community system: posts, comments, likes, image uploads
- Soft-delete system for safer data retention
- Workout routine builder (JSONB structure)
- Personal fitness dashboard with performance insights
- Trainer application workflow with admin approval
- Frontend input validation and clean error handling
- Public/private content visibility options
- User testimonials and social proof sections

## Customization

Tailwind CSS configuration can be modified in `tailwind.config.js`.
Color themes are managed in custom classes in `src/index.css`.

## Development Process

Designed UI in Figma → Imported and refined via Figma MCP.
Implemented structure using Cursor AI, which auto-suggested and generated React component scaffolds.
Manually refined component logic, responsive layouts, and TypeScript types for production-grade maintainability.
This workflow highlights AI-augmented front-end development — using design intelligence while maintaining developer control.

## License

MIT
