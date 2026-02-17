# ShipOrKill Backend

Production-ready Node.js backend for ShipOrKill — an AI-powered Product-Market Fit (PMF) validation platform.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Queue**: BullMQ + Redis
- **AI**: Anthropic Claude API
- **Payments**: Stripe
- **Email**: Resend
- **Storage**: AWS S3
- **Auth**: JWT
- **Validation**: Zod

## Features

- ✅ JWT authentication with refresh tokens
- ✅ Stripe payment integration
- ✅ BullMQ job queue for background processing
- ✅ AI-powered PMF analysis using Claude
- ✅ Web scraping and market research
- ✅ PDF report generation and S3 storage
- ✅ Email notifications via Resend
- ✅ Rate limiting and security middleware
- ✅ Graceful shutdown handling
- ✅ Comprehensive error handling

## Prerequisites

- Node.js >= 18
- MongoDB
- Redis
- AWS S3 bucket
- Anthropic API key
- Stripe account
- Resend API key

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your actual credentials
nano .env
```

## Environment Variables

See `.env.example` for all required variables. You MUST provide:

- Database: `MONGODB_URI`, `REDIS_URL`
- Auth: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`
- AI: `ANTHROPIC_API_KEY`
- Payments: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Email: `RESEND_API_KEY`, `EMAIL_FROM`
- Storage: `AWS_*` credentials and `S3_BUCKET_NAME`
- Frontend: `FRONTEND_URL`

## Development

```bash
# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

## Project Structure

```
src/
├── config/          # Environment config, DB, Redis, Stripe
├── models/          # Mongoose models (User, Report, Job, Payment)
├── routes/          # Express routes
├── controllers/     # Route handlers
├── services/        # Business logic
│   ├── ai/          # Claude AI integration
│   ├── analysis/    # PMF analysis, scraping, reporting
│   ├── queue/       # BullMQ queue and worker
│   ├── payment/     # Stripe integration
│   ├── notification/# Resend email service
│   └── storage/     # S3 file storage
├── middleware/      # Auth, validation, rate limiting, errors
├── utils/           # Utilities (logger, encryption, etc.)
└── types/           # TypeScript type definitions
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Reports
- `POST /api/reports/create` - Create PMF report
- `GET /api/reports/:id` - Get report details
- `GET /api/reports` - List user's reports
- `DELETE /api/reports/:id` - Delete report
- `GET /api/reports/:id/download` - Download report PDF

### Payments
- `POST /api/payments/checkout` - Create Stripe checkout
- `POST /api/payments/portal` - Customer portal
- `GET /api/payments/history` - Payment history

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Other
- `GET /health` - Health check

## Credits System

- Free tier: 1 credit (1 analysis)
- Paid tiers:
  - Idea Validation: $49
  - Landing Page Audit: $79
  - Demo Analysis: $99
  - Full PMF Audit: $199
  - Monthly Monitoring: $299/month (subscription)

## License

All Rights Reserved
