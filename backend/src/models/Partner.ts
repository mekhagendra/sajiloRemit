import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPartner extends Document {
  name: string;
  sendCountry: Types.ObjectId;
  receiveCountry: Types.ObjectId;
  logoUrl: string;
  website: string;
  description: string;
  isActive: boolean;
  featured: boolean;
  vendorId?: Types.ObjectId; // linked Vendor — rates from this vendor are pinned first in search results
  createdAt: Date;
  updatedAt: Date;
}

const partnerSchema = new Schema<IPartner>(
  {
    name: { type: String, required: false, trim: true, default: '' },
    sendCountry: { type: Schema.Types.ObjectId, ref: 'Country', required: true },
    receiveCountry: { type: Schema.Types.ObjectId, ref: 'Country', required: true },
    logoUrl: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', default: null },
  },
  { timestamps: true }
);

// Corridor-level uniqueness is enforced by PartnerRoute; no need for a duplicate index here

export default mongoose.model<IPartner>('Partner', partnerSchema);
