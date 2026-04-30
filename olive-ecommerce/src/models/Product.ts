import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string; // URL-friendly identifier
  sku?: string; // Inventory tracking
  description: string;
  price: number;
  category: string;
  images: string[]; // Changed to array for galleries
  stock: number;
  rating: number;
  reviews: number;
  featured: boolean;
  isActive: boolean; // For soft-deletes
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple products to have no SKU while keeping existing ones unique
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
      trim: true,
    },
    images: {
      type: [String],
      validate: [
        (val: string[]) => val.length > 0,
        'At least one product image is required',
      ],
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Search Index: Weight the name higher than the description for better search results
ProductSchema.index(
  { name: 'text', description: 'text', category: 'text' },
  { weights: { name: 5, category: 3, description: 1 } }
);

// Pre-save hook to automatically generate a slug from the product name
ProductSchema.pre('save', async function () {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/(^-|-$)+/g, ''); // Remove leading/trailing hyphens
  }
});

// Clean up API responses
ProductSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    // Destructure to remove internal Mongoose version key safely
    const { __v, ...safeProduct } = ret;
    return safeProduct;
  },
});

export default (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>('Product', ProductSchema);