# Kahade Backend Architecture

## Overview

Kahade backend follows a clean, modular architecture based on NestJS best practices with clear separation of concerns.

## Architecture Layers

### 1. Presentation Layer (API)

**Controllers** - Handle HTTP requests and responses
- Validate input using DTOs
- Call service layer
- Return formatted responses

### 2. Business Logic Layer (Core)

**Services** - Implement business logic
- Transaction management
- Data validation
- Business rules enforcement

**Repositories** - Data access abstraction
- Database operations
- Query optimization

### 3. Infrastructure Layer

**Database** - Prisma ORM with PostgreSQL
**Cache** - Redis for caching and sessions
**Queue** - Bull for background jobs
**Storage** - File upload management

### 4. Integration Layer

**Blockchain** - Web3/Ethers integration
**Payment** - Payment gateway integration
**Email** - Email service integration

## Design Patterns

### Repository Pattern

Abstracts data access logic:

```typescript
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}
  
  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

### Dependency Injection

NestJS's built-in DI container:

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cacheService: CacheService,
  ) {}
}
```

### Middleware Pattern

Request/response processing:

```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Log request
    next();
  }
}
```

## Data Flow

```
Client Request
  ↓
Nginx (Load Balancer)
  ↓
Middleware (Logging, CORS)
  ↓
Guards (Authentication, Authorization)
  ↓
Interceptors (Transform Request)
  ↓
Controller (Route Handler)
  ↓
Pipes (Validation)
  ↓
Service (Business Logic)
  ↓
Repository (Data Access)
  ↓
Database (Prisma + PostgreSQL)
  ↓
Interceptors (Transform Response)
  ↓
Client Response
```

## Module Structure

Each module follows this structure:

```
feature/
├── feature.module.ts      # Module definition
├── feature.controller.ts  # HTTP endpoints
├── feature.service.ts     # Business logic
├── feature.repository.ts  # Data access
├── dto/                   # Data transfer objects
│   ├── create-feature.dto.ts
│   └── update-feature.dto.ts
└── entities/              # Domain entities
    └── feature.entity.ts
```

## Database Design

### Entity Relationships

```
User
  ├── buyerTransactions (1:N)
  ├── sellerTransactions (1:N)
  ├── disputes (1:N)
  └── notifications (1:N)

Transaction
  ├── buyer (N:1)
  ├── seller (N:1)
  └── disputes (1:N)

Dispute
  ├── reporter (N:1)
  └── transaction (N:1)

Notification
  └── user (N:1)
```

## Security Architecture

### Authentication Flow

1. User submits credentials
2. Server validates credentials
3. Server generates JWT access + refresh tokens
4. Client stores tokens
5. Client includes access token in requests
6. Server validates token on each request
7. Client refreshes token when expired

### Authorization

- Role-based access control (RBAC)
- Guards check user roles
- Decorators mark required roles

## Caching Strategy

### Cache Levels

1. **Redis** - Session cache, frequently accessed data
2. **Database** - Query result caching
3. **Application** - In-memory caching

### Cache Invalidation

- Time-based (TTL)
- Event-based (on data update)

## Queue System

### Job Types

- **Email Queue** - Send emails asynchronously
- **Notification Queue** - Push notifications
- **Blockchain Queue** - Record transactions
- **Payment Queue** - Process payments

## Error Handling

### Exception Filters

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Log error
    // Format response
    // Return to client
  }
}
```

## Performance Optimization

1. **Database Indexing** - Optimized queries
2. **Connection Pooling** - Reuse connections
3. **Caching** - Reduce database load
4. **Pagination** - Limit result sets
5. **Lazy Loading** - Load data on demand

## Scalability

### Horizontal Scaling

- Stateless API servers
- Load balancer distribution
- Shared Redis cache
- Centralized database

### Vertical Scaling

- Increase server resources
- Optimize queries
- Add caching layers
