import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Safely extract the stkCallback object
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      console.error('Invalid M-Pesa payload received:', JSON.stringify(body));
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;

    // CRITICAL: Extract the orderNumber from the callback URL parameters.
    // Ensure your initiateMpesaPayment function sets the CallBackURL to: 
    // `https://your-domain.com/api/callback?order=${orderNumber}`
    const searchParams = new URL(req.url).searchParams;
    const orderNumberFromUrl = searchParams.get('order');

    await dbConnect();

    // Look up by URL param OR fallback to CheckoutRequestID if you saved it to your DB
    const orderQuery = orderNumberFromUrl 
      ? { orderNumber: orderNumberFromUrl } 
      : { mpesaCheckoutRequestId: CheckoutRequestID }; // Fallback if you added this to your schema

    if (ResultCode === 0) {
      // --- PAYMENT SUCCESSFUL ---
      const metadata = CallbackMetadata?.Item || [];
      const receiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const amountPaid = metadata.find((item: any) => item.Name === 'Amount')?.Value;

      await Order.findOneAndUpdate(
        orderQuery,
        {
          paymentStatus: 'completed',
          mpesaReceiptNumber: receiptNumber,
          $push: {
            trackingHistory: {
              status: 'processing',
              message: `Payment of KES ${amountPaid} confirmed. Receipt: ${receiptNumber}`,
              timestamp: new Date(),
            },
          },
        }
      );

      console.log(`✅ Payment successful. Receipt: ${receiptNumber} | Order: ${orderNumberFromUrl}`);

    } else {
      // --- PAYMENT FAILED OR CANCELLED ---
      // ResultCodes: 1032 (Cancelled by user), 1 (Insufficient funds), etc.
      await Order.findOneAndUpdate(
        orderQuery,
        {
          paymentStatus: 'failed',
          $push: {
            trackingHistory: {
              status: 'pending',
              message: `Payment failed or was cancelled: ${ResultDesc}`,
              timestamp: new Date(),
            },
          },
        }
      );

      console.log(`❌ Payment failed for Order ${orderNumberFromUrl}: ${ResultDesc}`);
    }

    // Always return a 200 Success to Safaricom if we processed it successfully, 
    // otherwise their servers will keep retrying the callback unnecessarily.
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });

  } catch (error) {
    console.error('M-Pesa callback database error:', error);
    
    // Return 500 ONLY if our database failed. This forces Safaricom to hold 
    // the callback in a queue and retry later when our DB is back online.
    return NextResponse.json({ error: 'Internal server error processing callback' }, { status: 500 });
  }
}