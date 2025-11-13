# FitHub - Performance-Driven Gym Community

A React web application for Performance-Driven Gym Community.

## Tech Stack

- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend as a Service (Database & Authentication)

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

## License

MIT
