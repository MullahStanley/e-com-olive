import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getAuthUser } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';
import { initiateMpesaPayment } from '@/lib/mpesa';
import { sendOrderConfirmation } from '@/lib/email';

const SHIPPING_COST = 200;

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, shippingAddress, paymentMethod, phoneNumber } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    await dbConnect();

    // 1. Backend Price Calculation (Never trust frontend totals)
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );
    const grandTotal = subtotal + SHIPPING_COST;

    // 2. M-Pesa Phone Normalization
    let mpesaNumber = phoneNumber;
    if (paymentMethod === 'mpesa' && phoneNumber) {
      const sanitizedPhone = phoneNumber.replace(/[\s-]/g, '');
      if (/^(?:254|\+254|0)?(7|1)\d{8}$/.test(sanitizedPhone)) {
        mpesaNumber = sanitizedPhone.replace(/^(?:\+254|0)?/, '254');
      } else {
        return NextResponse.json({ error: 'Invalid M-Pesa phone number format' }, { status: 400 });
      }
    }

    const orderNumber = generateOrderNumber();
    let orderId;

    // 3. MongoDB Transaction for Atomicity (Prevents Race Conditions)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify and decrement stock atomically
      for (const item of items) {
        // findOneAndUpdate with condition prevents overselling if two users checkout simultaneously
        const product = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity }, isActive: true },
          { $inc: { stock: -item.quantity } },
          { session, new: true }
        );

        if (!product) {
          throw new Error(`Insufficient stock or unavailable item: ${item.name}`);
        }
      }

      // Create order
      const orderData = [{
        orderNumber,
        userId: authUser.userId,
        items,
        total: grandTotal,
        paymentMethod,
        shippingAddress,
        trackingHistory: [{
          status: 'pending',
          message: 'Order placed successfully',
          timestamp: new Date(),
        }],
      }];

      const createdOrders = await Order.create(orderData, { session });
      orderId = createdOrders[0]._id;

      await session.commitTransaction();
    } catch (error: any) {
      await session.abortTransaction();
      return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 400 });
    } finally {
      session.endSession();
    }

    // 4. Initiate M-Pesa Payment
    let mpesaFailed = false;
    if (paymentMethod === 'mpesa') {
      try {
        await initiateMpesaPayment(mpesaNumber, grandTotal, orderNumber);
      } catch (error) {
        console.error('M-Pesa initiation failed:', error);
        mpesaFailed = true;
        // Update order to reflect failed payment initiation
        await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
      }
    }

    // 5. Send confirmation email
    sendOrderConfirmation(
      authUser.email,
      orderNumber,
      {
        items,
        total: grandTotal,
        paymentMethod,
        shippingAddress: `${shippingAddress.address}, ${shippingAddress.city}`,
      }
    ).catch(console.error);

    return NextResponse.json({
      message: 'Order placed successfully',
      orderNumber,
      orderId,
      mpesaStatus: mpesaFailed ? 'failed' : 'initiated'
    }, { status: 201 });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed due to a server error' }, { status: 500 });
  }
}