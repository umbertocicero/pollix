# Planora

A collaborative polling and scheduling platform built with Next.js, NestJS, and Supabase.

## 🚀 Quick Start with GitHub Codespaces

1. **Create a GitHub repository** and push this code
2. **Open in Codespaces**: Click "Code" → "Codespaces" → "Create codespace"
3. **Wait for setup**: The devcontainer will install all dependencies automatically
4. **Configure Supabase**:
   - Create a free account at [supabase.com](https://supabase.com)
   - Create a new project
   - Copy your project URL and keys to `.env.local`
   - Run the migration in Supabase SQL Editor

## 📁 Project Structure

```
planora/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types and utilities
├── supabase/
│   └── migrations/   # Database migrations
└── .devcontainer/    # GitHub Codespaces config
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🎨 Features

- ✅ Single choice polls
- ✅ Multiple choice polls
- ✅ Calendar/date polls
- ✅ Anonymous voting
- ✅ Shareable links
- ✅ Real-time results
- ✅ Multilingual (EN/IT)
- ✅ Dark mode

## 📦 Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, shadcn/ui
- **Backend**: NestJS, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Deployment**: Vercel

## 🚢 Deployment

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Add environment variables
3. Deploy!

### Database (Supabase)
1. Run migrations in SQL Editor
2. Enable Row Level Security
3. Configure authentication providers

## 📄 License

MIT
