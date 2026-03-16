import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  rating: number;
  text: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ vendorId: 1 });
reviewSchema.index({ userId: 1, vendorId: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', reviewSchema);
