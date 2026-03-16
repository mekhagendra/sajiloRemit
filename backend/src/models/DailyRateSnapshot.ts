import mongoose, { Schema, Document } from 'mongoose';

export interface IRateEntry {
  vendorId: mongoose.Types.ObjectId;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  unit: number;
  fee: number;
}

export interface IDailyRateSnapshot extends Document {
  date: string; // YYYY-MM-DD
  rates: IRateEntry[];
  createdAt: Date;
}

const rateEntrySchema = new Schema<IRateEntry>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    fromCurrency: { type: String, required: true, uppercase: true, trim: true },
    toCurrency: { type: String, required: true, uppercase: true, trim: true },
    rate: { type: Number, required: true },
    unit: { type: Number, default: 1 },
    fee: { type: Number, default: 0 },
  },
  { _id: false }
);

const dailyRateSnapshotSchema = new Schema<IDailyRateSnapshot>(
  {
    date: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    rates: [rateEntrySchema],
  },
  { timestamps: true }
);

dailyRateSnapshotSchema.index({ date: -1 });

export default mongoose.model<IDailyRateSnapshot>('DailyRateSnapshot', dailyRateSnapshotSchema);
