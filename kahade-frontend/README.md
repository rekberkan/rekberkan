# Kahade Frontend

Frontend application for Kahade - Platform Escrow P2P Terpercaya (Trusted P2P Escrow Platform).

## Tech Stack

- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS 4** - Styling
- **Vite** - Build Tool
- **Wouter** - Routing
- **Framer Motion** - Animations
- **Recharts** - Charts
- **shadcn/ui** - UI Components

## Design System

This frontend uses **"Blockchain Clarity"** - a Glassmorphic Tech design system featuring:

- **Dark Theme** with glassmorphism effects
- **Primary Color**: Deep Indigo (#4338CA)
- **Accent Color**: Cyan Glow (#22D3EE)
- **Typography**: Outfit (display), Inter (body), JetBrains Mono (data)

## Features

### Landing Pages
- Home page with hero section and features
- How it Works page
- About page
- Contact page

### User Dashboard
- Dashboard overview with stats
- Transaction management (list, create, detail)
- Wallet (balance, top-up, withdraw)
- Notifications
- Profile settings
- KYC verification

### Admin Dashboard
- Platform statistics with charts
- User management
- Transaction monitoring
- Dispute resolution
- Audit logs
- Platform settings

## Project Structure

```
client/
├── public/
│   └── images/          # Static images
├── src/
│   ├── components/
│   │   ├── layout/      # Layout components (Navbar, Footer, etc.)
│   │   └── ui/          # shadcn/ui components
│   ├── contexts/        # React contexts (Auth, Theme)
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities and API client
│   ├── pages/
│   │   ├── admin/       # Admin dashboard pages
│   │   ├── auth/        # Authentication pages
│   │   └── dashboard/   # User dashboard pages
│   ├── types/           # TypeScript definitions
│   ├── App.tsx          # Main app with routing
│   ├── index.css        # Global styles and design tokens
│   └── main.tsx         # Entry point
└── index.html
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Environment Variables

Create a `.env` file with:

```env
VITE_API_URL=http://localhost:3001/api/v1
```

## API Integration

The frontend is designed to integrate with the Kahade Backend API. The API client is located at `client/src/lib/api.ts` with the following modules:

- `authApi` - Authentication endpoints
- `userApi` - User profile and KYC
- `transactionApi` - Transaction management
- `walletApi` - Wallet operations
- `notificationApi` - Notifications
- `ratingApi` - User ratings
- `adminApi` - Admin operations

## Pages Overview

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/how-it-works` | How the platform works |
| `/about` | About Kahade |
| `/contact` | Contact form |
| `/login` | User login |
| `/register` | User registration |
| `/forgot-password` | Password recovery |
| `/dashboard` | User dashboard |
| `/dashboard/transactions` | Transaction list |
| `/dashboard/transactions/:id` | Transaction detail |
| `/dashboard/create-transaction` | Create new transaction |
| `/dashboard/wallet` | Wallet management |
| `/dashboard/notifications` | Notifications |
| `/dashboard/profile` | User profile |
| `/dashboard/settings` | User settings |
| `/admin` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/transactions` | Transaction management |
| `/admin/disputes` | Dispute resolution |
| `/admin/audit-logs` | Audit logs |
| `/admin/settings` | Platform settings |

## License

MIT
