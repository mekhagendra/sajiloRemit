import mongoose, { Schema, Document } from 'mongoose';
import { BannerPosition } from '../types/enums';

export interface IBanner extends Document {
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: BannerPosition;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, default: '' },
    position: {
      type: String,
      enum: Object.values(BannerPosition),
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBanner>('Banner', bannerSchema);
