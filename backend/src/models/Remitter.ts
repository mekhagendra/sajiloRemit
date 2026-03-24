import mongoose, { Schema, Document } from 'mongoose';
import { RemitterStatus } from '../types/enums';

export interface IRemitterCountry {
  countryCode: string;
  canSend: boolean;
  canReceive: boolean;
  isActive: boolean; // toggled by admin to enable/disable service in this country
}

export interface IRemitter extends Document {
  userId: mongoose.Types.ObjectId;
  legalName: string;
  baseCountry: string;
  supportedCountries: IRemitterCountry[];
  email: string;
  phone: string;
  website: string;
  remittanceUrl: string;
  description: string;
  logo: string;
  status: RemitterStatus;
  apiIntegration?: {
    enabled: boolean;
    apiUrl?: string;
    apiKey?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const remitterCountrySchema = new Schema<IRemitterCountry>(
  {
    countryCode: { type: String, required: true, uppercase: true, trim: true },
    canSend:     { type: Boolean, default: false },
    canReceive:  { type: Boolean, default: false },
    isActive:    { type: Boolean, default: false }, // admin activates
  },
  { _id: false }
);

const remitterSchema = new Schema<IRemitter>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    legalName: { type: String, required: true, trim: true },
    baseCountry: { type: String, default: '' },
    supportedCountries: [remitterCountrySchema],
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    website: { type: String, trim: true },
    remittanceUrl: { type: String, trim: true, default: '' },
    description: { type: String, trim: true },
    logo: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(RemitterStatus),
      default: RemitterStatus.PENDING,
    },
    apiIntegration: {
      enabled: { type: Boolean, default: false },
      apiUrl: { type: String },
      apiKey: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IRemitter>('Remitter', remitterSchema);
