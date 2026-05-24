# Olive E-Commerce (ShopHub)

Next.js storefront with **PostgreSQL** (Prisma, Odoo-inspired ERP models), **Stripe Checkout**, and separated Tailwind CSS modules.

## Stack

- **Next.js 16** (App Router)
- **PostgreSQL** + **Prisma** — partners, products, sale orders, order lines, stock moves, payment transactions
- **Stripe Checkout Sessions** + signed webhooks
- **Tailwind CSS v4** — shared and per-page/component styles under `src/styles/`

## Quick start

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start PostgreSQL and set `DATABASE_URL` in `.env`.

3. Install dependencies and migrate:

```bash
bun install
bun run db:push
bun run db:seed
```

4. Configure [Stripe](https://dashboard.stripe.com):

   - Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
   - Webhook endpoint: `POST /api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.expired`
   - For local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

5. Run the dev server:

```bash
bun dev
```

Default admin after seed: `admin@shophub.local` / `Admin123!` (override with `SEED_ADMIN_PASSWORD`).

## ERP data model (Odoo-inspired)

| Model | Odoo analogue | Purpose |
|-------|---------------|---------|
| `Partner` | `res.partner` | Customers & admins |
| `Product` / `ProductCategory` | `product.template` | Catalog |
| `SaleOrder` / `SaleOrderLine` | `sale.order` | Orders |
| `StockMove` | `stock.move` | Inventory ledger |
| `PaymentTransaction` | `account.payment` | Stripe payment audit trail |

Manage data visually with Prisma Studio: `bun run db:studio`.

## Security notes

- Checkout totals are computed server-side from database prices (never trust client cart prices).
- Admin APIs require an authenticated `admin` role.
- Order tracking requires login and ownership (or admin).
- Stripe webhooks verify signatures before updating orders.
