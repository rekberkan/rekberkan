# Kahade Backend API

🚀 **Kahade** is a secure P2P escrow platform built with NestJS, Prisma, PostgreSQL, and blockchain integration.

[![CI](https://github.com/rekberkan/kahade/actions/workflows/ci.yml/badge.svg)](https://github.com/rekberkan/kahade/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3-red.svg)](https://nestjs.com/)

> **✅ Status**: All issues fixed - Ready for development!  
> **📝 Audit Report**: See [AUDIT_REPORT.md](./docs/AUDIT_REPORT.md)

---

## 🌟 Features

- ✅ **Authentication & Authorization**: JWT-based auth with refresh tokens
- ✅ **User Management**: Complete user CRUD with role-based access control
- ✅ **Escrow Transactions**: Secure P2P transaction management with multiple statuses
- ✅ **Dispute Resolution**: Built-in dispute management system
- ✅ **Blockchain Integration**: Transaction recording on blockchain for transparency
- ✅ **Payment Gateway**: Integration with payment gateways (Midtrans, Xendit compatible)
- ✅ **Real-time Notifications**: User notification system
- ✅ **Email Service**: Automated email notifications
- ✅ **Caching**: Redis caching for improved performance
- ✅ **Queue Management**: Bull queue for background jobs
- ✅ **API Documentation**: Auto-generated Swagger documentation
- ✅ **Testing**: Jest testing framework setup
- ✅ **Health Checks**: Comprehensive health check endpoints

---

## 🛠️ Tech Stack

- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache**: Redis 7
- **Queue**: Bull (Redis-based)
- **Blockchain**: Web3.js / Ethers.js
- **Authentication**: Passport JWT
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Email**: Nodemailer

---

## 📋 Prerequisites

- Node.js 20 or higher
- PostgreSQL 16
- Redis 7
- Yarn or npm
- Docker & Docker Compose (optional)

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/rekberkan/kahade.git
cd kahade/kahade-backend
```

### 2. Install dependencies

```bash
yarn install
# or
npm install
```

### 3. Environment setup

```bash
cp .env.example .env.development
```

Edit `.env.development` with your configuration:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/kahade_dev
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Generate secrets**:

```bash
node scripts/generate-secret.js
```

### 4. Database setup

```bash
# Generate Prisma Client
yarn prisma:generate

# Run migrations
yarn prisma migrate dev

# Seed database with test data
yarn prisma:seed
```

### 5. Run the application

```bash
# Development mode
yarn start:dev

# Production mode
yarn build
yarn start:prod
```

The API will be available at `http://localhost:3000`

Swagger documentation: `http://localhost:3000/api/v1/docs`

---

## 🐳 Docker Setup

### Development

```bash
cd docker
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- API on port 3000

### Production

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📁 Project Structure

```
kahade-backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.ts          # Database seeding
├── src/
│   ├── api/             # API versioning
│   ├── common/          # Shared utilities
│   ├── config/          # Configuration modules
│   ├── core/            # Business logic
│   │   ├── auth/
│   │   ├── user/
│   │   ├── transaction/
│   │   ├── dispute/
│   │   └── notification/
│   ├── health/          # Health checks
│   ├── infrastructure/  # External services
│   │   ├── database/
│   │   ├── cache/
│   │   ├── queue/
│   │   └── storage/
│   ├── integrations/    # Third-party integrations
│   │   ├── blockchain/
│   │   ├── payment/
│   │   └── email/
│   ├── jobs/            # Background processors
│   ├── security/        # Security utilities
│   ├── app.module.ts
│   └── main.ts
├── test/                # E2E tests
├── docker/              # Docker configuration
├── deploy/              # Deployment files
├── scripts/             # Utility scripts
└── docs/                # Additional documentation
```

---

## 🔐 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### Users

- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update profile
- `GET /api/v1/users/:id` - Get user by ID

### Transactions

- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions` - Get all transactions
- `GET /api/v1/transactions/:id` - Get transaction details
- `PUT /api/v1/transactions/:id/status` - Update transaction status
- `POST /api/v1/transactions/:id/confirm-payment` - Confirm payment
- `POST /api/v1/transactions/:id/release-funds` - Release funds
- `POST /api/v1/transactions/:id/cancel` - Cancel transaction

### Disputes

- `POST /api/v1/disputes` - Create dispute
- `GET /api/v1/disputes` - Get all disputes (Admin)
- `GET /api/v1/disputes/:id` - Get dispute details
- `PUT /api/v1/disputes/:id/resolve` - Resolve dispute (Admin)

### Notifications

- `GET /api/v1/notifications` - Get all notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read

### Health

- `GET /health` - Complete health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

---

## 🧪 Testing

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov

# Watch mode
yarn test:watch
```

---

## 📝 Scripts

```bash
# Development
yarn start:dev       # Start development server
yarn start:debug     # Start with debugger

# Production
yarn build           # Build for production
yarn start:prod      # Start production server

# Code Quality
yarn lint            # Run ESLint
yarn lint:fix        # Fix ESLint errors
yarn format          # Format with Prettier
yarn format:check    # Check formatting

# Database
yarn prisma:generate # Generate Prisma Client
yarn prisma:migrate  # Run migrations (production)
yarn prisma:studio   # Open Prisma Studio
yarn prisma:seed     # Seed database

# Testing
yarn test            # Run tests
yarn test:cov        # With coverage
yarn test:e2e        # E2E tests

# Utilities
make help            # Show all Make commands
make install         # Install dependencies
make dev             # Start development
make test            # Run tests
make docker-up       # Start Docker containers
```

---

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt (10 rounds)
- Rate limiting (3-tier)
- CORS protection
- Helmet security headers
- Input validation (class-validator)
- SQL injection prevention (Prisma)
- XSS protection
- CSRF protection

---

## 🌐 Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy with Docker

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

### Deploy with PM2

```bash
./deploy/deploy.sh
```

---

## 📚 Documentation

- **[API Documentation](http://localhost:3000/api/v1/docs)** - Swagger UI
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deployment instructions
- **[API Examples](./docs/API_EXAMPLES.md)** - Usage examples
- **[Security Policy](./docs/SECURITY.md)** - Security guidelines
- **[Contributing](./docs/CONTRIBUTING.md)** - How to contribute
- **[FAQ](./docs/FAQ.md)** - Frequently asked questions
- **[Audit Report](./docs/AUDIT_REPORT.md)** - Code audit results

---

## 🐛 Issue Tracking

Found a bug? Have a feature request?

1. Check [existing issues](https://github.com/rekberkan/kahade/issues)
2. Create a new issue using our [templates](.github/ISSUE_TEMPLATE/)
3. For security issues, email: security@kahade.com

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/kahade.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m 'feat: add amazing feature'

# Push and create PR
git push origin feature/amazing-feature
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👥 Authors

**Rekberkan Team**

---

## 📞 Support

For support:

- **Email**: support@kahade.com
- **Issues**: [GitHub Issues](https://github.com/rekberkan/kahade/issues)
- **Documentation**: [docs.kahade.com](https://docs.kahade.com)

---

## 🚀 Roadmap

- [x] Core escrow functionality
- [x] Blockchain integration
- [x] Payment gateway integration
- [x] Email notifications
- [x] Health checks
- [ ] WebSocket real-time updates
- [ ] Admin dashboard
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Mobile app API
- [ ] KYC verification

---

## ⭐ Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [PostgreSQL](https://www.postgresql.org/) - Advanced database
- [Redis](https://redis.io/) - In-memory data store
- [Bull](https://github.com/OptimalBits/bull) - Queue system

---

**Made with ❤️ by Rekberkan Team**

🚀 Happy Coding!
