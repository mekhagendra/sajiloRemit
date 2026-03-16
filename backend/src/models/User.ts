import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '../types/enums';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  suspendReason?: string;
  favoriteVendors: mongoose.Types.ObjectId[];
  rateAlerts: {
    fromCurrency: string;
    toCurrency: string;
    targetRate: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    suspendReason: { type: String },
    favoriteVendors: [{ type: Schema.Types.ObjectId, ref: 'Vendor' }],
    rateAlerts: [
      {
        fromCurrency: { type: String, required: true },
        toCurrency: { type: String, required: true },
        targetRate: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { password: _, ...rest } = ret;
    return rest;
  },
});

export default mongoose.model<IUser>('User', userSchema);
