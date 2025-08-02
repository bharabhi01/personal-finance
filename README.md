# Personal Finance Tracker

A comprehensive personal finance application built with Next.js and Supabase, designed to help you track your income, expenses, investments, and savings.

## Features

- **Dashboard**: Overview of your financial status with key metrics
- **Expense Tracking**: Add, categorize, and analyze your expenses
- **Income Management**: Track income from various sources
- **Investment Tracking**: Monitor your investments
- **Budget Management**: Set monthly spending limits with alerts and tracking
- **Data Visualization**: Visual charts for income, expenses, and savings
- **Authentication**: Secure user authentication with Supabase
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication)
- **State Management**: React Context API
- **Form Validation**: React Hook Form, Zod
- **Data Visualization**: Chart.js, React-Chartjs-2
- **Icons & UI**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd personal-finance-app
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Supabase Setup

In your Supabase project, create the following tables:

**transactions**
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- amount (numeric)
- source (text)
- tags (text[])
- date (date)
- type (text) - 'expense', 'income', or 'investment'
- investment_name (text, optional)
- created_at (timestamptz, default: now())
- updated_at (timestamptz, default: now())

**tags**
- id (uuid, primary key)
- name (text)
- user_id (uuid, foreign key to auth.users)
- color (text, optional)
- created_at (timestamptz, default: now())

**budgets**
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- monthly_limit (numeric)
- month (text) - Format: YYYY-MM
- created_at (timestamptz, default: now())
- updated_at (timestamptz, default: now())

5. Run the development server

```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## License

MIT
