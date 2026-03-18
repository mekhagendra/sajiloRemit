import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  remitterId: mongoose.Types.ObjectId;
  rating: number;
  text: string;
  transactionDate: Date;
  transactionNumber: string;
  evidenceUrl?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    remitterId: { type: Schema.Types.ObjectId, ref: 'Remitter', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    transactionDate: { type: Date, required: true },
    transactionNumber: { type: String, required: true, trim: true, maxlength: 100 },
    evidenceUrl: { type: String, trim: true },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ remitterId: 1 });
reviewSchema.index({ userId: 1, remitterId: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', reviewSchema);
