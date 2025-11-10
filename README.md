# FitHub - Performance-Driven Gym Community

A modern React web app built to connect and empower the fitness community.

## Overview

FitHub is a performance-driven gym community platform designed to help users achieve their fitness goals through data tracking, social motivation, and professional trainer matching.
The project began as a hands-on exploration of React 18 and modern front-end development workflows, combining Cursor AI and Figma MCP for intelligent UI generation and rapid iteration.

This project demonstrates proficiency in React ecosystem architecture, component-driven design, and AI-assisted development — forming the foundation for future integration with a database-backed system for real-time data handling and user management.

## Tech Stack

- **React 18** - UI component architecture
- **TypeScript** - Type safety and clean code structure
- **Vite** - Lightning-fast build and development server
- **Tailwind CSS** - Responsive and maintainable styling
- **Database integration (MongoDB / Firebase) is planned for future updates to enable user profiles, community posts, and workout tracking.
- 
## Getting Started

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view it.

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
│   │   └── Footer.tsx
│   ├── App.tsx         # Main App Component
│   ├── main.tsx        # Entry Point
│   └── index.css       # Global Styles
├── public/             # Static Files
└── index.html          # HTML Template
```

## Key Features

- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Modern UI/UX
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
