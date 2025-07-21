This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- **Meal Planning**: Personalized meal planning with recipe generation
- **User Wallet**: Integrated payment system with Stripe for API credits
- **Recipe Management**: Generate, save, and manage recipes with ingredients and steps
- **Nutrition Tracking**: Track calories, protein, and fat intake

## Getting Started

First, set up your environment variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Wallet System

The app includes a user wallet system that allows users to:

- **View Balance**: See current balance, total paid, total used, and requests made
- **Top Up**: Add funds in $2, $5, or $10 increments using Stripe embedded checkout
- **Track Usage**: Monitor API request costs and usage

The wallet is automatically created for new users and integrates with Stripe for secure payments.

## Database Schema

The app uses Supabase with the following key tables:

- `Users`: User profile information
- `Goals`: User fitness and dietary goals
- `MealPlan`: User cuisine preferences
- `Recipes`: Generated recipes with nutritional info
- `Ingredients`: Recipe ingredients with purchase status
- `Steps`: Recipe cooking instructions
- `Wallets`: User payment and usage tracking

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
