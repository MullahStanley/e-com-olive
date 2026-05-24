import nodemailer from 'nodemailer';

// 1. Fail-fast environment variable validation
const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASSWORD,
  NEXT_PUBLIC_API_URL,
} = process.env;

if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASSWORD) {
  console.warn('⚠️ Missing required Email environment variables. Emails will fail to send.');
}

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: parseInt(EMAIL_PORT || '587', 10),
  secure: parseInt(EMAIL_PORT || '587', 10) === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderDetails {
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  shippingAddress: string;
}

// ==========================================
// Template Generators
// ==========================================

function generateOrderConfirmationText(orderNumber: string, orderDetails: OrderDetails): string {
  const itemsText = orderDetails.items
    .map((item) => `- ${item.name} (x${item.quantity}): KES ${item.price.toFixed(2)}`)
    .join('\n');

  return `
Order Confirmed!
Thank you for shopping with ShopHub.

Your Order Number: ${orderNumber}

Order Details:
${itemsText}

Total Amount: KES ${orderDetails.total.toFixed(2)}

Payment Method: ${orderDetails.paymentMethod}
Shipping Address: ${orderDetails.shippingAddress}

Track your order here: ${NEXT_PUBLIC_API_URL}/track-order?order=${orderNumber}

Need help? Contact support@shophub.com
  `.trim();
}

function generateOrderConfirmationHTML(orderNumber: string, orderDetails: OrderDetails): string {
  const itemsHTML = orderDetails.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">KES ${item.price.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px;">Order Confirmed!</h1>
                  <p style="margin: 10px 0 0 0; color: #e0f2fe; font-size: 16px;">Thank you for shopping with ShopHub</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; text-align: center; background-color: #f0f9ff;">
                  <p style="margin: 0; color: #666; font-size: 14px;">Your Order Number</p>
                  <p style="margin: 10px 0; color: #0ea5e9; font-size: 28px; font-weight: bold; letter-spacing: 2px;">${orderNumber}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">Order Details</h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #f9fafb;">
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #0ea5e9; color: #666; font-size: 14px;">Item</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #0ea5e9; color: #666; font-size: 14px;">Qty</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #0ea5e9; color: #666; font-size: 14px;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHTML}
                    </tbody>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                    <tr>
                      <td style="padding: 15px; background-color: #f0f9ff; text-align: right; border-radius: 4px;">
                        <span style="color: #666; font-size: 16px; margin-right: 20px;">Total Amount:</span>
                        <span style="color: #0ea5e9; font-size: 24px; font-weight: bold;">KES ${orderDetails.total.toFixed(2)}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <div style="background-color: #f9fafb; padding: 20px; border-radius: 4px; border-left: 4px solid #0ea5e9;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: bold;">Payment Method</p>
                    <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">${orderDetails.paymentMethod}</p>
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: bold;">Shipping Address</p>
                    <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6;">${orderDetails.shippingAddress}</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 30px 30px 30px; text-align: center;">
                  <a href="${NEXT_PUBLIC_API_URL}/track-order?order=${orderNumber}" 
                     style="display: inline-block; background-color: #0ea5e9; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                    Track Your Order
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ==========================================
// Exported Email Services
// ==========================================

export async function sendOrderConfirmation(
  email: string,
  orderNumber: string,
  orderDetails: OrderDetails
): Promise<boolean> {
  const mailOptions = {
    from: `"ShopHub" <${EMAIL_USER}>`,
    to: email,
    subject: `Order Confirmation - ${orderNumber}`,
    text: generateOrderConfirmationText(orderNumber, orderDetails), // Plain text fallback
    html: generateOrderConfirmationHTML(orderNumber, orderDetails), // HTML version
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${email} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const plainText = `Hi ${name},\n\nWelcome to ShopHub! We're excited to have you.\nStart shopping: ${NEXT_PUBLIC_API_URL}/products`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to ShopHub!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${name},</p>
          <p>Thank you for joining ShopHub! We're excited to have you as part of our community.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${NEXT_PUBLIC_API_URL}/products" 
               style="display: inline-block; background-color: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Start Shopping
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"ShopHub" <${EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to ShopHub!',
    text: plainText,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
}

//set up an email queue (like BullMQ)