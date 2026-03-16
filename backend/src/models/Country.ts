import mongoose, { Schema, Document } from 'mongoose';

export interface ICountry extends Document {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  flag: string; // emoji or URL
  currency: string; // e.g. 'NPR'
  currencyName: string; // e.g. 'Nepalese Rupee'
  isSendCountry: boolean;
  isReceiveCountry: boolean;
  isActive: boolean;
  priority: number; // lower = shown first in best rates list
  createdAt: Date;
  updatedAt: Date;
}

const countrySchema = new Schema<ICountry>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    flag: { type: String, trim: true, default: '' },
    currency: { type: String, required: true, trim: true },
    currencyName: { type: String, required: true, trim: true },
    isSendCountry: { type: Boolean, default: false },
    isReceiveCountry: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 999 },
  },
  { timestamps: true }
);

export default mongoose.model<ICountry>('Country', countrySchema);
