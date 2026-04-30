import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string; // Optional because 'select: false' might omit it
  name: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  isLocked: boolean; // Virtual property
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // Automatically creates an index
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // CRITICAL: Excludes from query results by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    phone: {
      type: String,
      trim: true,
      // Validates Kenyan phone numbers (e.g., 07.., 01.., 2547.., +2541..)
      match: [/^(?:254|\+254|0)?(7|1)\d{8}$/, 'Please enter a valid Kenyan phone number'],
    },
    address: {
      type: String,
      trim: true,
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
      select: false, 
    },
    lockUntil: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Ensure virtuals are included in JSON outputs
    toObject: { virtuals: true },
  }
);

// Virtual property to easily check if the account is currently locked out
UserSchema.virtual('isLocked').get(function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Secondary safeguard: strip sensitive fields if they were explicitly selected
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    // Destructure out the sensitive/internal fields, keep the rest
    const { password, loginAttempts, lockUntil, __v, ...safeUser } = ret;
    return safeUser;
  },
});

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);