import axios from 'axios';

// 1. Fail-fast environment variable validation
const {
  MPESA_ENVIRONMENT,
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
} = process.env;

if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_SHORTCODE || !MPESA_PASSKEY || !MPESA_CALLBACK_URL) {
  throw new Error('Missing required M-Pesa Daraja environment variables.');
}

const MPESA_BASE_URL =
  MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

interface MpesaTokenResponse {
  access_token: string;
  expires_in: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface StkQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

// 2. Token Caching Mechanism
let cachedToken: string | null = null;
let tokenExpiryTime: number | null = null;

async function getMpesaToken(): Promise<string> {
  // Return cached token if it exists and hasn't expired (adding a 60-second buffer)
  if (cachedToken && tokenExpiryTime && Date.now() < tokenExpiryTime - 60000) {
    return cachedToken;
  }

  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');

  try {
    const response = await axios.get<MpesaTokenResponse>(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    cachedToken = response.data.access_token;
    // expires_in is usually "3599" seconds
    tokenExpiryTime = Date.now() + parseInt(response.data.expires_in, 10) * 1000;

    return cachedToken;
  } catch (error: any) {
    console.error('❌ M-Pesa token error:', error.response?.data || error.message);
    throw new Error('Failed to fetch M-Pesa access token');
  }
}

// 3. DRY Helper for Timestamp and Password
function getMpesaAuthCredentials() {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
  return { timestamp, password };
}

// Format phone number helper
function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.startsWith('254')) return cleaned;
  if (cleaned.startsWith('0')) return `254${cleaned.slice(1)}`;
  return `254${cleaned}`; // Fallback assuming local number without 0
}

export async function initiateMpesaPayment(
  phoneNumber: string,
  amount: number,
  orderNumber: string
): Promise<StkPushResponse> {
  try {
    const accessToken = await getMpesaToken();
    const phone = formatPhoneNumber(phoneNumber);
    const { timestamp, password } = getMpesaAuthCredentials();

    const response = await axios.post<StkPushResponse>(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: phone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: orderNumber,
        TransactionDesc: `Payment for order ${orderNumber}`,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ M-Pesa STK Push initiated:', response.data);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.errorMessage || error.message;
    console.error('❌ M-Pesa STK Push error:', errorMessage);
    throw new Error(`Failed to initiate M-Pesa payment: ${errorMessage}`);
  }
}

export async function queryMpesaTransaction(checkoutRequestID: string): Promise<StkQueryResponse> {
  try {
    const accessToken = await getMpesaToken();
    const { timestamp, password } = getMpesaAuthCredentials();

    const response = await axios.post<StkQueryResponse>(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.errorMessage || error.message;
    console.error('❌ M-Pesa query error:', errorMessage);
    throw new Error(`Failed to query M-Pesa transaction: ${errorMessage}`);
  }
}