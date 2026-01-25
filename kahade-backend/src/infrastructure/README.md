# Infrastructure Layer

This directory contains infrastructure-related modules that handle external services and system resources.

## Modules

### Database (Prisma)

- **prisma.service.ts**: Prisma ORM service
- **prisma.module.ts**: Database module configuration
- Handles PostgreSQL connections and queries

### Cache (Redis)

- **cache.service.ts**: Redis caching service
- **cache.module.ts**: Cache module configuration
- Provides caching for improved performance

### Queue (Bull)

- **queue.service.ts**: Bull queue service
- **queue.module.ts**: Queue module configuration
- Handles background jobs (email, notifications, blockchain)

### Storage

- **storage.service.ts**: File storage service
- **storage.module.ts**: Storage module configuration
- Manages file uploads and downloads

## Usage Examples

### Database

```typescript
import { PrismaService } from '@infrastructure/database/prisma.service';

const users = await this.prisma.user.findMany();
```

### Cache

```typescript
import { CacheService } from '@infrastructure/cache/cache.service';

await this.cache.set('key', 'value', 3600);
const value = await this.cache.get('key');
```

### Queue

```typescript
import { QueueService } from '@infrastructure/queue/queue.service';

await this.queue.addJob('email', 'send-email', data);
```

### Storage

```typescript
import { StorageService } from '@infrastructure/storage/storage.service';

const url = await this.storage.upload(file);
```
