import mongoose, { Schema, Document } from 'mongoose';

export interface IBank extends Document {
  name: string;
  logoUrl?: string;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bankSchema = new Schema<IBank>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    logoUrl: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBank>('Bank', bankSchema);
