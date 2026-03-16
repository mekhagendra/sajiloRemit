import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  thumbnail: string;
  shortDescription: string;
  content: string;
  author: mongoose.Types.ObjectId;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    thumbnail: { type: String, default: '' },
    shortDescription: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IBlog>('Blog', blogSchema);
