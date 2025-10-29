# Kasefra Web Client - Setup Guide

## Prerequisites Installation

### 1. Install Node.js and npm

The kasefra-web-client requires Node.js 18+ and npm to run.

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 2. Install Dependencies

```bash
cd /home/munsif/Desktop/Kasefra/kasefra-web-client

# Install existing dependencies
npm install

# Install additional required packages
npm install axios react-hook-form @hookform/resolvers zod sonner next-themes

# Install shadcn/ui CLI and components
npx shadcn@latest init

# When prompted, select:
# - Style: New York
# - Base color: Slate
# - CSS variables: Yes
# - Use React Server Components: Yes
# - Write configuration: Yes

# Add shadcn/ui components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add form
npx shadcn@latest add sidebar
npx shadcn@latest add separator
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add toast
npx shadcn@latest add skeleton
```

### 3. Configure Environment

Create `.env.local` file:

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_VERSION=v1
EOF
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:3000

## Quick Start (After Node.js Installation)

```bash
# 1. Navigate to project
cd /home/munsif/Desktop/Kasefra/kasefra-web-client

# 2. Install all dependencies
npm install

# 3. Install additional packages
npm install axios react-hook-form @hookform/resolvers zod sonner next-themes lucide-react class-variance-authority clsx tailwind-merge

# 4. Initialize shadcn/ui (interactive)
npx shadcn@latest init

# 5. Add all components at once
npx shadcn@latest add button card input label form sidebar separator dropdown-menu avatar toast skeleton

# 6. Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
echo "NEXT_PUBLIC_API_VERSION=v1" >> .env.local

# 7. Start development
npm run dev
```

## Project Structure After Setup

```
kasefra-web-client/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css           (Updated with Kasefra theme)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/                   (shadcn components)
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── landing/
│   │   └── providers/
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── hooks/
│   │   └── utils.ts
│   └── types/
│       └── auth.ts
├── .env.local                    (Backend API configuration)
├── components.json               (shadcn configuration)
└── package.json
```

## Backend Integration

Make sure the FastAPI backend is running:

```bash
# In another terminal
cd /home/munsif/Desktop/Kasefra/kasefra-backend

# Start backend on port 5000
export PATH="$HOME/.var/app/com.visualstudio.code/data/../bin:$PATH"
uv run uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

## Testing the Setup

1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:5000
3. **Backend Docs**: http://localhost:5000/api/v1/docs

## Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### CORS errors
Make sure backend `.env` has:
```
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Next Steps

After setup is complete, the implementation will create all necessary files for:
- Landing page with hero section
- Login/Signup pages with form validation
- Protected dashboard with sidebar
- Full authentication flow with sessionStorage

All files follow the implementation plan in this directory.