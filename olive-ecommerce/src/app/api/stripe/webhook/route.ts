import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { stripe, getStripeWebhookSecret } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        return NextResponse.json({ error: 'Missing order metadata' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        const order = await tx.saleOrder.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'completed',
            status: 'processing',
            stripeSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
          },
        });

        await tx.paymentTransaction.upsert({
          where: { stripeEventId: event.id },
          create: {
            orderId: order.id,
            stripeEventId: event.id,
            amount: order.total,
            status: 'completed',
            metadata: { type: event.type },
          },
          update: { status: 'completed' },
        });

        await tx.orderTrackingEvent.create({
          data: {
            orderId: order.id,
            status: 'processing',
            message: 'Payment confirmed via Stripe',
          },
        });
      });
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId) {
        return NextResponse.json({ received: true });
      }

      await prisma.$transaction(async (tx) => {
        const order = await tx.saleOrder.findUnique({
          where: { id: orderId },
          include: { lines: true },
        });

        if (!order || order.paymentStatus === 'completed') {
          return;
        }

        for (const line of order.lines) {
          await tx.product.update({
            where: { id: line.productId },
            data: { stockQty: { increment: line.quantity } },
          });
          await tx.stockMove.create({
            data: {
              productId: line.productId,
              orderId: order.id,
              quantity: line.quantity,
              moveType: 'in',
              reference: `${order.orderNumber}-cancel`,
            },
          });
        }

        await tx.saleOrder.update({
          where: { id: orderId },
          data: { paymentStatus: 'failed', status: 'cancelled' },
        });

        await tx.orderTrackingEvent.create({
          data: {
            orderId,
            status: 'cancelled',
            message: 'Checkout session expired — stock restored',
          },
        });
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
