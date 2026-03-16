import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGalleryFile extends Document {
  filename: string;       // stored filename on disk
  originalName: string;   // original upload filename
  mimeType: string;
  size: number;           // bytes
  url: string;            // public URL path e.g. /uploads/gallery/abc.jpg
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const galleryFileSchema = new Schema<IGalleryFile>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IGalleryFile>('GalleryFile', galleryFileSchema);
