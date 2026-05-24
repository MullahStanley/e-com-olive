import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string; // Marked as optional in TS
}

export interface ITrackingUpdate {
  status: string;
  message: string;
  timestamp: Date;
}

// 1. Extract enums to keep TS interfaces and Mongoose validation perfectly in sync
export const OrderStatusEnum = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
export const PaymentMethodEnum = ['mpesa', 'card'] as const;
export const PaymentStatusEnum = ['pending', 'completed', 'failed', 'refunded'] as const;

export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  total: number;
  status: typeof OrderStatusEnum[number];
  paymentMethod: typeof PaymentMethodEnum[number];
  paymentStatus: typeof PaymentStatusEnum[number];
  mpesaReceiptNumber?: string;
  mpesaCheckoutRequestId?: string; // 2. Added to link Daraja callbacks to this order
  shippingAddress: IShippingAddress;
  trackingHistory: ITrackingUpdate[];
  createdAt: Date;
  updatedAt: Date;
}

// 3. Subdocument Schemas to keep the DB clean (removes unnecessary nested _ids)
const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
    image: { type: String, required: true },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true },
  },
  { _id: false }
);

const TrackingUpdateSchema = new Schema<ITrackingUpdate>(
  {
    status: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [OrderItemSchema],
    total: { type: Number, required: true, min: [0, 'Total cannot be negative'] },
    status: { type: String, enum: OrderStatusEnum, default: 'pending', index: true },
    paymentMethod: { type: String, enum: PaymentMethodEnum, required: true },
    paymentStatus: { type: String, enum: PaymentStatusEnum, default: 'pending', index: true },
    mpesaReceiptNumber: { type: String, index: true, sparse: true },
    mpesaCheckoutRequestId: { type: String, index: true, sparse: true }, 
    shippingAddress: { type: ShippingAddressSchema, required: true },
    trackingHistory: [TrackingUpdateSchema],
  },
  { timestamps: true }
);

// 4. Pre-save hook to auto-generate a clean Order Number (e.g., ORD-20260315-A1B2)
OrderSchema.pre('save', async function () {
  // Only generate if the document is new and doesn't already have an order number
  if (this.isNew && !this.orderNumber) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars
    this.orderNumber = `ORD-${dateStr}-${randomStr}`;
  }
});

// Clean up API responses (same pattern we used in the User and Product schemas)
OrderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    const { __v, ...safeOrder } = ret;
    return safeOrder;
  },
});

export default (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema);