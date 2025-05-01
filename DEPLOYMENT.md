# RetailBandhu Deployment Guide

This document provides instructions for deploying the RetailBandhu application to various environments.

## Prerequisites

Before deploying, ensure you have the following:

- Node.js 18.x or higher
- Access to a PostgreSQL database
- Supabase account and project setup
- Environment variables configured

## Environment Variables

Configure the following environment variables:

### Required

- `POSTGRES_URL`: PostgreSQL connection string
- `POSTGRES_PRISMA_URL`: PostgreSQL connection string for Prisma
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase URL (same as SUPABASE_URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public Supabase anon key (same as SUPABASE_ANON_KEY)

### Optional

- `POSTGRES_URL_NON_POOLING`: Non-pooling PostgreSQL connection string
- `SUPABASE_JWT_SECRET`: JWT secret for Supabase
- `NEXT_PUBLIC_APP_URL`: The public-facing URL of your application
- Various payment gateway credentials (if using payment features)

## Deployment Options

### 1. Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deploy with default settings

### 2. Docker

1. Build the Docker image:
   \`\`\`
   docker build -t retail-bandhu .
   \`\`\`

2. Run the container:
   \`\`\`
   docker run -p 3000:3000 --env-file .env.production retail-bandhu
   \`\`\`

### 3. Traditional Node.js Hosting

1. Install dependencies:
   \`\`\`
   npm ci
   \`\`\`

2. Build the application:
   \`\`\`
   npm run deploy
   \`\`\`

3. Start the server:
   \`\`\`
   npm start
   \`\`\`

## Database Setup

Run the combined SQL schema against your PostgreSQL database:

\`\`\`
psql -U your_user -d your_database -f deployment/combined-schema.sql
\`\`\`

## Post-Deployment Verification

After deployment, verify the following:

1. Health check endpoint returns 200 OK:
   \`\`\`
   curl https://your-domain.com/api/health
   \`\`\`

2. Public pages load correctly
3. Authentication works
4. Features function as expected

## Troubleshooting

- Check application logs for errors
- Verify environment variables are set correctly
- Ensure database connection is working
- Check service worker registration
- Review network requests for API errors

## Monitoring

Consider setting up monitoring with:
- Vercel Analytics
- Sentry for error tracking
- Uptime Robot for availability monitoring

## Security Considerations

- Review Content Security Policy settings
- Keep dependencies updated
- Regularly backup your database
- Monitor for suspicious activity
