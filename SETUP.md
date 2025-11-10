# Setup and Running Guide

## How to Fix ERR_CONNECTION_REFUSED Error

This error occurs when the development server is not running. Follow these steps:

### Step 1: Navigate to Project Directory

```bash
cd gym-community
```

Or open the `gym-community` folder in File Explorer and open a terminal in that folder.

### Step 2: Install Dependencies

```bash
npm install
```

This command installs all packages defined in package.json (React, Vite, Tailwind CSS, etc.).

### Step 3: Start Development Server

```bash
npm run dev
```

On success, you'll see a message like:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 4: Open in Browser

Open the URL shown in the terminal (usually `http://localhost:5173`) in your browser.

## Troubleshooting

### Port Already in Use

To use a different port:
```bash
npm run dev -- --port 3000
```

### Dependency Installation Errors

```bash
# Clear cache and reinstall
npm cache clean --force
npm install
```

### Still Can't Connect

1. Check if firewall is blocking the port
2. Check if another program is using the same port
3. Verify that `npm run dev` is running properly in the terminal
