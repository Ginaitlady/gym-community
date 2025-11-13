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
gym-community/
├── src/
│   ├── components/      # React Components
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Stats.tsx
│   │   ├── Community.tsx
│   │   ├── Footer.tsx
│   │   └── SignUpModal.tsx
│   ├── lib/             # Supabase Client
│   │   └── supabase.ts
│   ├── utils/           # Utility Functions
│   │   └── api.ts       # API Client
│   ├── App.tsx         # Main App Component
│   ├── main.tsx        # Entry Point
│   └── index.css       # Global Styles
├── public/             # Static Files
└── index.html          # HTML Template
```

## Project Status
This is an ongoing project currently under development.  
The next phase will include backend integration for user authentication, workout tracking, and community interaction.

## Key Features

- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Modern UI/UX
- ✅ User Sign Up with Supabase Integration
- ✅ Supabase PostgreSQL Database for User Storage
- ✅ Built-in Authentication & Security
- ✅ Row Level Security (RLS) Policies
- ✅ Input Validation (Frontend)
- ✅ Performance Tracking Section
- ✅ Community Features
- ✅ Statistics and Performance Display
- ✅ User Testimonials

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
