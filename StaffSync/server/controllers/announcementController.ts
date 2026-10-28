import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { AnnouncementModel, NotificationModel, UserModel, AuditLogModel } from '../models/index.js';

export const announcementController = {
  async getAnnouncements(req: AuthRequest, res: Response) {
    try {
      const userRole = req.user?.role || 'Employee';
      let items = AnnouncementModel.find();

      // Filter by role visibility unless HR
      if (userRole === 'Employee') {
        items = items.filter(a => a.isPublished && (a.targetAudience === 'All' || a.targetAudience === 'Employees'));
      } else if (userRole === 'Manager') {
        items = items.filter(a => a.isPublished && (a.targetAudience === 'All' || a.targetAudience === 'Managers'));
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.status(200).json({ success: true, count: items.length, announcements: items });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createAnnouncement(req: AuthRequest, res: Response) {
    try {
      const { title, content, message, category = 'General', targetAudience = 'All' } = req.body;
      const textContent = content || message;

      if (!title || !textContent) {
        return res.status(400).json({ success: false, message: 'Title and content/message are required.' });
      }

      const announcement = AnnouncementModel.create({
        title,
        content: textContent,
        message: textContent,
        category,
        authorId: req.user?._id || '',
        authorName: req.user?.name || 'HR Admin',
        targetAudience: ['All', 'Employees', 'Managers'].includes(targetAudience) ? targetAudience : 'All',
        publishAt: new Date().toISOString(),
        isPublished: true
      });

      // Broadcast notification to targeted users
      const allUsers = UserModel.find({ isActive: true });
      for (const u of allUsers) {
        let shouldNotify = false;
        if (targetAudience === 'All') shouldNotify = true;
        else if (targetAudience === 'Employees' && u.role === 'Employee') shouldNotify = true;
        else if (targetAudience === 'Managers' && u.role === 'Manager') shouldNotify = true;

        if (shouldNotify && u._id !== req.user?._id) {
          NotificationModel.create({
            recipientId: u._id,
            title: `New Announcement: ${title}`,
            message: textContent.substring(0, 100) + (textContent.length > 100 ? '...' : ''),
            notificationType: 'Announcement',
            relatedEntityType: 'Announcement',
            relatedEntityId: announcement._id,
            isRead: false
          });
        }
      }

      AuditLogModel.create({
        actorId: req.user?._id || 'SYSTEM',
        actorName: req.user?.name || 'Admin',
        action: 'CREATE_ANNOUNCEMENT',
        entityType: 'Announcement',
        entityId: announcement._id,
        details: `Published announcement "${title}" to ${targetAudience}`
      });

      return res.status(201).json({ success: true, message: 'Announcement published successfully', announcement });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateAnnouncement(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const existing = AnnouncementModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }

      const updated = AnnouncementModel.findByIdAndUpdate(id, req.body);
      return res.status(200).json({ success: true, message: 'Announcement updated', announcement: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteAnnouncement(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const existing = AnnouncementModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }

      AnnouncementModel.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Announcement deleted.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
