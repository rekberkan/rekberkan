# Prisma Database Schema

This directory contains all database-related files for the Kahade backend.

## Structure

```
prisma/
├── schema.prisma          # Main schema file with all models
├── migrations/            # Database migrations
└── seed.ts               # Database seeding script
```

## Commands

### Generate Prisma Client

```bash
yarn prisma:generate
# or
npx prisma generate
```

### Create Migration

```bash
yarn prisma migrate dev --name migration_name
# or
npx prisma migrate dev --name your_migration_name
```

### Apply Migrations (Production)

```bash
yarn prisma:migrate
# or
npx prisma migrate deploy
```

### Reset Database

```bash
npx prisma migrate reset
```

### Seed Database

```bash
yarn prisma:seed
# or
ts-node prisma/seed.ts
```

### Open Prisma Studio

```bash
yarn prisma:studio
# or
npx prisma studio
```

Access Prisma Studio at: http://localhost:5555

## Schema Organization

The `schema.prisma` file contains:

- **Enums**: UserRole, UserStatus, TransactionStatus, DisputeStatus, NotificationType
- **Models**: 
  - User (authentication and profile)
  - Transaction (escrow transactions)
  - Dispute (dispute resolution)
  - Notification (user notifications)

## Database Models

### User Model

```prisma
model User {
  id              String
  email           String @unique
  password        String
  name            String
  phone           String?
  avatar          String?
  bio             String?
  role            UserRole
  status          UserStatus
  emailVerified   Boolean
  // ... relations and timestamps
}
```

### Transaction Model

```prisma
model Transaction {
  id                String
  title             String
  description       String?
  amount            Decimal
  currency          String
  status            TransactionStatus
  blockchainTxHash  String?
  // ... payment tracking and relations
}
```

### Dispute Model

```prisma
model Dispute {
  id            String
  reason        String
  description   String
  status        DisputeStatus
  resolution    String?
  // ... relations and timestamps
}
```

### Notification Model

```prisma
model Notification {
  id       String
  type     NotificationType
  title    String
  message  String
  read     Boolean
  metadata Json?
  // ... relations and timestamps
}
```

## Relationships

- User has many buyerTransactions (as buyer)
- User has many sellerTransactions (as seller)
- User has many disputes
- User has many notifications
- Transaction belongs to buyer (User)
- Transaction belongs to seller (User)
- Transaction has many disputes
- Dispute belongs to reporter (User)
- Dispute belongs to transaction
- Notification belongs to user

## Adding New Models

1. Edit `schema.prisma` and add your model:

```prisma
model YourModel {
  id        String   @id @default(uuid())
  // your fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("your_table_name")
}
```

2. Create migration:

```bash
yarn prisma migrate dev --name add_your_model
```

3. Generate Prisma Client:

```bash
yarn prisma:generate
```

## Best Practices

1. **Always create migrations in development first**
2. **Test migrations before applying to production**
3. **Use descriptive migration names**
4. **Add indexes for frequently queried fields**
5. **Use proper data types (e.g., Decimal for money)**
6. **Define proper relationships with foreign keys**
7. **Use @@map() to control table names**
8. **Add @@index() for performance optimization**

## Indexes

Current indexes for performance:

- `Transaction.buyerId`
- `Transaction.sellerId`
- `Transaction.status`
- `Dispute.transactionId`
- `Dispute.reporterId`
- `Dispute.status`
- `Notification.userId`
- `Notification.read`

## Common Issues

### "Prisma Client could not find a schema.prisma file"

Make sure you're in the correct directory and run:

```bash
yarn prisma:generate
```

### "Migration failed"

1. Check database connection
2. Review migration SQL
3. Reset if needed: `npx prisma migrate reset`

### "Relation field type doesn't match"

Ensure foreign key types match the referenced field type.

## Seeding

The `seed.ts` file creates:

- Admin user (admin@kahade.com / admin123456)
- Test buyer (buyer@test.com / admin123456)
- Test seller (seller@test.com / admin123456)
- Sample transaction

**Note**: Change default passwords in production!
