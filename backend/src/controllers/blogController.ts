import { Request, Response } from 'express';
import Blog from '../models/Blog';
import { AuthRequest } from '../middleware/auth';

export const createBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, thumbnail, shortDescription, content, isPublished } = req.body;

    const blog = await Blog.create({
      title,
      thumbnail,
      shortDescription,
      content,
      author: req.user!._id,
      isPublished: isPublished || false,
    });

    res.status(201).json({ blog });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBlogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find({ isPublished: true })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments({ isPublished: true });

    res.json({ blogs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBlogById = async (req: Request, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name');
    if (!blog) {
      res.status(404).json({ message: 'Blog not found' });
      return;
    }
    res.json({ blog });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!blog) {
      res.status(404).json({ message: 'Blog not found' });
      return;
    }
    res.json({ blog });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      res.status(404).json({ message: 'Blog not found' });
      return;
    }
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
