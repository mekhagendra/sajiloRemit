# SajiloRemit

A web application to compare remittance exchange rates from different service providers sending money to Nepal.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB
- **Auth**: JWT

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)

### Backend Setup

```bash
cd backend
cp .env.example .env    # Edit .env with your settings
npm install
npm run seed            # Seed the database with sample data
npm run dev             # Start development server on port 5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev             # Start development server on port 5173
```

### Test Accounts (after seeding)

| Role   | Email                     | Password  |
|--------|---------------------------|-----------|
| Admin  | admin@sajiloremit.com     | admin123  |
| Vendor | vendor1@sajiloremit.com   | vendor123 |
| User   | user1@sajiloremit.com     | user123   |

## API Endpoints

### Public
- `GET /api/rates/search?fromCurrency=AUD&toCurrency=NPR&amount=1000` - Search rates
- `GET /api/rates/best` - Best rates to Nepal
- `GET /api/vendors` - List approved vendors
- `GET /api/bank-rates` - Bank interest rates
- `GET /api/blogs` - Blog posts
- `GET /api/reviews/latest` - Latest reviews
- `GET /api/statistics` - Platform statistics
- `GET /api/forex?base=USD` - Forex rates
- `GET /api/banners` - Active banners

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Vendor (authenticated)
- `POST /api/vendors` - Register vendor
- `POST /api/rates` - Add/update rate
- `GET /api/rates/vendor` - Get vendor's rates

### Admin (authenticated)
- `GET /api/admin/vendors` - All vendors
- `PUT /api/admin/vendors/:id/status` - Approve/reject vendor
- `GET /api/admin/users` - All users
- `PUT /api/admin/users/:id/status` - Suspend/activate user
- `GET /api/admin/reviews` - All reviews
- `PUT /api/admin/reviews/:id` - Moderate review

## Project Structure

```
sajiloremit/
├── backend/
│   └── src/
│       ├── config/         # DB connection & env config
│       ├── controllers/    # Route handlers
│       ├── middleware/      # Auth middleware
│       ├── models/          # Mongoose models
│       ├── routes/          # Express routes
│       ├── types/           # TypeScript enums
│       ├── utils/           # Utility functions
│       ├── seed.ts          # Database seeder
│       └── server.ts        # Entry point
├── frontend/
│   └── src/
│       ├── api/             # Axios API client
│       ├── components/      # React components
│       ├── context/         # Auth context
│       ├── pages/           # Page components
│       └── types/           # TypeScript types
└── README.md
```
