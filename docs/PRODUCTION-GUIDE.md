# Production Readiness & OAuth Implementation Guide

**From**: Garrett (Principal - Infrastructure) & Nathan (Principal - App)
**To**: Engineering Team & Founder
**Date**: 2026-01-13

---

## 🔐 OAuth Implementation Strategy

### Garrett's Infrastructure Recommendations

> "For production auth, we need to consider both **agent authentication** (internal) and **customer sessions** (external). I recommend a hybrid approach."

#### Option 1: Build Your Own JWT (Recommended for MVP)

**Pros**: Full control, no external dependencies, works offline
**Cons**: More code to maintain

```typescript
// Implementation approach:
// 1. Use @nestjs/jwt + @nestjs/passport
// 2. bcrypt for password hashing (already added)
// 3. Refresh token rotation for security
```

**Required packages**:
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
npm install -D @types/passport-jwt @types/passport-local
```

#### Option 2: External OAuth Provider (Google/Auth0/Okta)

**Pros**: Enterprise features (SSO, MFA, audit logs), less code
**Cons**: External dependency, potential cost, requires internet

**Recommended for**:
- Enterprise customers requiring SSO
- Multi-tenant SaaS deployment
- Compliance requirements (SOC2, HIPAA)

---

### Nathan's Application Architecture

> "Auth should be a separate module that guards all other modules. Here's the structure I recommend:"

```
src/
├── modules/
│   ├── auth/                    # NEW - Auth Module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── local.strategy.ts
│   │   │   └── google.strategy.ts  # Optional OAuth
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── customer-session.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       ├── register.dto.ts
│   │       └── token.dto.ts
│   ├── agent/                   # Protected by jwt-auth.guard
│   ├── chat/                    # Protected by customer-session.guard
│   └── metrics/                 # Protected by roles.guard (admin only)
```

---

## 🚀 Production Readiness Checklist

### Critical (Must Have)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| JWT Authentication | ⬜ TODO | Jordan | For agents and admins |
| Customer Session Management | ⬜ TODO | Alex | Token for anonymous chat |
| Rate Limiting | ⬜ TODO | Riley | Prevent abuse |
| CORS Configuration | ⬜ TODO | Taylor | Allow frontend domains |
| Environment Validation | ⬜ TODO | Casey | Fail fast on missing vars |
| Health Check Endpoints | ⬜ TODO | Taylor | For load balancer |
| Request Logging | ⬜ TODO | Riley | Audit trail |
| Error Sanitization | ⬜ TODO | Casey | Hide stack traces in prod |

### Important (Should Have)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Refresh Token Rotation | ⬜ TODO | Jordan | Security best practice |
| Password Reset Flow | ⬜ TODO | Alex | Email integration |
| API Versioning | ⬜ TODO | Marcus | /api/v1, /api/v2 |
| Database Migrations | ⬜ TODO | Garrett | TypeORM migrations |
| Secrets Management | ⬜ TODO | Garrett | AWS Secrets Manager |
| SSL/TLS Termination | ⬜ TODO | DevOps | nginx/ALB |
| Helmet.js Security | ⬜ TODO | Casey | HTTP headers |

### Nice to Have (Could Have)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| OAuth2 (Google/GitHub) | ⬜ TODO | Jordan | Social login |
| MFA/2FA | ⬜ TODO | Jordan | TOTP support |
| API Key Management | ⬜ TODO | Alex | For integrations |
| Webhook Signatures | ⬜ TODO | Jordan | Verify callbacks |

---

## 🏗️ Sarah's Production Environment Setup

### Required Environment Variables

```bash
# Production .env additions:

# JWT Configuration
JWT_SECRET=<use-openssl-rand-32-hex>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<different-secret>
JWT_REFRESH_EXPIRES_IN=7d

# OAuth (if using)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://api.yourapp.com/auth/google/callback

# Security
CORS_ORIGINS=https://yourapp.com,https://admin.yourapp.com
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Database (production)
DB_SSL=true
DB_POOL_SIZE=20

# Logging
LOG_LEVEL=info
SENTRY_DSN=

# Feature Flags
ENABLE_REGISTRATION=false
REQUIRE_EMAIL_VERIFICATION=true
```

### Deployment Checklist

```bash
# Before deploying to production:

# 1. Build verification
npm run build
npm run test
npm run lint

# 2. Security audit
npm audit

# 3. Database migrations
npm run migration:run

# 4. Environment validation
node -e "require('./dist/config').validateEnv()"
```

---

## 📊 Marcus's Implementation Priority

### Phase 1: MVP Auth (Week 1)

1. **JWT Module Setup** - Jordan
   - Local strategy for login
   - JWT strategy for protected routes
   - Refresh token endpoint

2. **Guard Implementation** - Alex
   - `@UseGuards(JwtAuthGuard)` for agent routes
   - `@UseGuards(RolesGuard)` for admin routes

3. **Customer Sessions** - Morgan
   - Anonymous session tokens
   - Session persistence in Redis

### Phase 2: Production Hardening (Week 2)

1. Rate limiting with `@nestjs/throttler`
2. CORS configuration
3. Helmet.js security headers
4. Request/response logging
5. Error handling middleware

### Phase 3: Optional OAuth (Week 3+)

1. Google OAuth for agents
2. SSO integration (if enterprise)
3. MFA support

---

## 🔧 Quick Implementation: JWT Auth

Here's the minimal code to get started:

```typescript
// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

```typescript
// src/modules/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

```typescript
// Usage in controllers:
@Controller('api/v1/agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  // All routes now require valid JWT
}
```

---

## 📝 Action Items

| Task | Assignee | Priority | Due |
|------|----------|----------|-----|
| Install auth packages | Taylor | P0 | Today |
| Create AuthModule scaffold | Jordan | P0 | Day 1 |
| Implement JWT strategy | Jordan | P0 | Day 2 |
| Add guards to Agent routes | Alex | P1 | Day 3 |
| Swagger documentation | Taylor | P0 | Day 1-2 |
| E2E auth tests | Quinn | P1 | Day 3 |

---

*Prepared by: Garrett (Principal - Infra), Nathan (Principal - App)*
*Reviewed by: Sarah (Platform Lead), Marcus (Feature Lead)*
