import mongoose, { Schema, Document } from 'mongoose';

export interface IRemittanceRate extends Document {
  remitterId: mongoose.Types.ObjectId;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  unit: number;
  fee: number;
  updatedAt: Date;
  createdAt: Date;
}

const remittanceRateSchema = new Schema<IRemittanceRate>(
  {
    remitterId: { type: Schema.Types.ObjectId, ref: 'Remitter', required: true },
    fromCurrency: { type: String, required: true, uppercase: true, trim: true },
    toCurrency: { type: String, required: true, uppercase: true, trim: true },
    rate: { type: Number, required: true },
    unit: { type: Number, default: 1 },
    fee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

remittanceRateSchema.index({ fromCurrency: 1, toCurrency: 1, rate: -1 });
remittanceRateSchema.index({ remitterId: 1 });

export default mongoose.model<IRemittanceRate>('RemittanceRate', remittanceRateSchema);
