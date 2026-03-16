import mongoose, { Schema, Document } from 'mongoose';

export interface IBankInterestRate extends Document {
  bank: mongoose.Types.ObjectId;
  plan: string;
  duration: string;
  rate: number;
  paymentTerm: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bankInterestRateSchema = new Schema<IBankInterestRate>(
  {
    bank: { type: Schema.Types.ObjectId, ref: 'Bank', required: true },
    plan: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    rate: { type: Number, required: true },
    paymentTerm: { type: String, required: true, trim: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IBankInterestRate>('BankInterestRate', bankInterestRateSchema);
