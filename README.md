# Retail Bandhu V3

A comprehensive platform connecting retailers, wholesalers, and delivery partners in the retail ecosystem.

## Features

### User Management
- Multi-role authentication (Retailer, Wholesaler, Delivery Partner, Admin)
- Profile management
- Role-based access control

### Retailer Features
- Product browsing and searching
- Order management
- Checkout with multiple payment options
- Tax reporting
- Dashboard with analytics

### Wholesaler Features
- Product management
- Order management
- Payment tracking
- Tax reporting
- Dashboard with analytics

### Delivery Partner Features
- Order assignments
- Active deliveries tracking
- Delivery history
- Dashboard with analytics

### Admin Features
- User management
- Role management
- System status monitoring
- Configuration management
- Analytics dashboard
- Security audit tools
- Database management
- Performance monitoring
- Automated testing

### System Features
- Multi-language support
- Voice input
- Offline mode
- Comprehensive logging
- Error tracking
- Development mode indicators
- Notification system

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Supabase (Authentication, Database, Storage)
- shadcn/ui Components

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
\`\`\`

### Installation

1. Clone the repository
\`\`\`bash
git clone https://github.com/your-username/retail-bandhu-v3.git
cd retail-bandhu-v3
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Run the development server
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Setup

1. Create a new Supabase project
2. Run the SQL scripts in the `lib` directory to set up the database schema
   - `create-tables.sql`
   - `enable-rls.sql`
   - `create-functions.sql`
   - `create-triggers.sql`
   - `create-notification-triggers.sql`
   - `create-policies.sql`
   - `status-tables.sql`
   - `security-audit-tables.sql`
   - `migrations-tables.sql`
   - `rls-testing-tables.sql`
   - `performance-tables.sql`
   - `testing-tables.sql`

## Project Structure

\`\`\`
retail-bandhu-v3/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin pages
│   ├── retailer/           # Retailer pages
│   ├── wholesaler/         # Wholesaler pages
│   ├── delivery/           # Delivery partner pages
│   ├── components/         # Shared components
│   ├── api/                # API routes
│   └── ...
├── components/             # Global components
├── lib/                    # Utility functions and services
├── public/                 # Static assets
└── ...
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
\`\`\`

## 19. Let's create a comprehensive error handling system
