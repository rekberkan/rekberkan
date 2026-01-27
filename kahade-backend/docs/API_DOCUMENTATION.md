# Kahade P2P Escrow Platform - API Documentation

## Overview

This document provides comprehensive API documentation for the Kahade P2P Escrow Platform backend.

**Base URL:** `https://api.kahade.com/api/v1`

**Authentication:** Bearer Token (JWT)

## Authentication

### Register

Create a new user account.

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "phone": "+6281234567890",
  "password": "SecureP@ssw0rd!"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "phone": "+6281234567890",
    "emailVerified": false,
    "kycStatus": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

### Login

Authenticate and receive tokens.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!",
  "mfaCode": "123456"  // Optional, required if MFA enabled
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

### Refresh Token

Get new access token using refresh token.

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

## Orders

### Create Order

Create a new escrow order.

```http
POST /orders
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "iPhone 15 Pro Max",
  "description": "Brand new, sealed box",
  "category": "ELECTRONICS",
  "amountMinor": 2500000000,  // 25,000,000 IDR in minor units (sen)
  "currency": "IDR",
  "initiatorRole": "SELLER",
  "feePayer": "BUYER",
  "holdingPeriodDays": 7,
  "customTerms": "Buyer must confirm within 3 days of delivery"
}
```

**Response (201 Created):**
```json
{
  "id": "order-uuid",
  "orderNumber": "ORD-2024-001234",
  "title": "iPhone 15 Pro Max",
  "description": "Brand new, sealed box",
  "category": "ELECTRONICS",
  "amountMinor": 2500000000,
  "currency": "IDR",
  "platformFeeMinor": 62500000,
  "status": "WAITING_COUNTERPARTY",
  "inviteToken": "abc123xyz",
  "inviteExpiresAt": "2024-01-22T10:30:00Z",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Accept Order

Accept an order invitation.

```http
POST /orders/:orderId/accept
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "inviteToken": "abc123xyz"
}
```

**Response (200 OK):**
```json
{
  "id": "order-uuid",
  "status": "PENDING_ACCEPT",
  "acceptedAt": "2024-01-15T11:00:00Z"
}
```

### Pay for Order

Initiate payment for an order (buyer only).

```http
POST /orders/:orderId/pay
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "paymentMethod": "BANK_TRANSFER"
}
```

**Response (200 OK):**
```json
{
  "paymentId": "payment-uuid",
  "paymentUrl": "https://payment.xendit.co/...",
  "expiresAt": "2024-01-15T12:00:00Z",
  "amount": 25625000,
  "currency": "IDR"
}
```

### Confirm Delivery

Confirm receipt and release escrow (buyer only).

```http
POST /orders/:orderId/confirm
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Great seller, fast shipping!"
}
```

**Response (200 OK):**
```json
{
  "id": "order-uuid",
  "status": "COMPLETED",
  "completedAt": "2024-01-20T10:30:00Z"
}
```

## Wallet

### Get Wallet Balance

```http
GET /wallet
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "wallet-uuid",
  "currency": "IDR",
  "balance": 5000000000,
  "balanceFormatted": "Rp 50.000.000",
  "locked": 2500000000,
  "lockedFormatted": "Rp 25.000.000",
  "available": 2500000000,
  "availableFormatted": "Rp 25.000.000"
}
```

### Request Withdrawal

```http
POST /wallet/withdraw
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amountMinor": 1000000000,
  "bankCode": "BCA",
  "accountNumber": "1234567890",
  "accountName": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "id": "withdrawal-uuid",
  "amountMinor": 1000000000,
  "feeMinor": 6500,
  "netAmountMinor": 999993500,
  "status": "PENDING",
  "estimatedArrival": "2024-01-16T10:30:00Z"
}
```

## Disputes

### Open Dispute

```http
POST /orders/:orderId/dispute
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "ITEM_NOT_AS_DESCRIBED",
  "description": "The item received is different from the listing",
  "evidenceUrls": [
    "https://storage.kahade.com/evidence/photo1.jpg",
    "https://storage.kahade.com/evidence/photo2.jpg"
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "dispute-uuid",
  "orderId": "order-uuid",
  "reason": "ITEM_NOT_AS_DESCRIBED",
  "status": "OPEN",
  "createdAt": "2024-01-18T10:30:00Z"
}
```

## Error Responses

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/orders",
  "requestId": "req_abc123"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `INSUFFICIENT_BALANCE` | 422 | Wallet balance too low |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 5 requests | 1 minute |
| API (authenticated) | 100 requests | 1 minute |
| Webhooks | 1000 requests | 1 minute |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Webhooks

### Payment Webhook

Receive payment status updates.

```http
POST /webhooks/payment
X-Callback-Token: <webhook_secret>
Content-Type: application/json

{
  "event": "payment.paid",
  "data": {
    "id": "payment-uuid",
    "external_id": "order-uuid",
    "status": "PAID",
    "amount": 25625000,
    "paid_at": "2024-01-15T11:30:00Z"
  }
}
```

**Response (200 OK):**
```json
{
  "status": "received"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { KahadeClient } from '@kahade/sdk';

const client = new KahadeClient({
  baseUrl: 'https://api.kahade.com',
  apiKey: 'your-api-key',
});

// Create order
const order = await client.orders.create({
  title: 'iPhone 15 Pro Max',
  amountMinor: 2500000000,
  initiatorRole: 'SELLER',
});

// Get wallet balance
const wallet = await client.wallet.getBalance();
console.log(`Available: ${wallet.availableFormatted}`);
```

### Python

```python
from kahade import KahadeClient

client = KahadeClient(
    base_url='https://api.kahade.com',
    api_key='your-api-key'
)

# Create order
order = client.orders.create(
    title='iPhone 15 Pro Max',
    amount_minor=2500000000,
    initiator_role='SELLER'
)

# Get wallet balance
wallet = client.wallet.get_balance()
print(f"Available: {wallet.available_formatted}")
```

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Authentication endpoints
- Order management
- Wallet operations
- Dispute handling
