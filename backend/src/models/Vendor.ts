import mongoose, { Schema, Document } from 'mongoose';
import { VendorStatus } from '../types/enums';

export interface IVendorCountry {
  countryCode: string;
  canSend: boolean;
  canReceive: boolean;
  isActive: boolean; // toggled by admin to enable/disable service in this country
}

export interface IVendor extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  baseCountry: string;
  supportedCountries: IVendorCountry[];
  email: string;
  phone: string;
  website: string;
  description: string;
  logo: string;
  status: VendorStatus;
  apiIntegration?: {
    enabled: boolean;
    apiUrl?: string;
    apiKey?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const vendorCountrySchema = new Schema<IVendorCountry>(
  {
    countryCode: { type: String, required: true, uppercase: true, trim: true },
    canSend:     { type: Boolean, default: false },
    canReceive:  { type: Boolean, default: false },
    isActive:    { type: Boolean, default: false }, // admin activates
  },
  { _id: false }
);

const vendorSchema = new Schema<IVendor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true, trim: true },
    baseCountry: { type: String, required: true },
    supportedCountries: [vendorCountrySchema],
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    website: { type: String, trim: true },
    description: { type: String, trim: true },
    logo: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(VendorStatus),
      default: VendorStatus.PENDING,
    },
    apiIntegration: {
      enabled: { type: Boolean, default: false },
      apiUrl: { type: String },
      apiKey: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IVendor>('Vendor', vendorSchema);
