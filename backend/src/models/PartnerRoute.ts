import mongoose, { Schema, Document } from 'mongoose';

export interface IPartnerRoute extends Document {
  sendCountry: mongoose.Types.ObjectId;
  receiveCountry: mongoose.Types.ObjectId;
  partner: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const partnerRouteSchema = new Schema<IPartnerRoute>(
  {
    sendCountry: { type: Schema.Types.ObjectId, ref: 'Country', required: true },
    receiveCountry: { type: Schema.Types.ObjectId, ref: 'Country', required: true },
    partner: { type: Schema.Types.ObjectId, ref: 'Partner', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Prevent duplicate routes for the same corridor
partnerRouteSchema.index({ sendCountry: 1, receiveCountry: 1 }, { unique: true });

export default mongoose.model<IPartnerRoute>('PartnerRoute', partnerRouteSchema);
