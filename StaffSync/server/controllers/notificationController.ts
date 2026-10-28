import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { NotificationModel } from '../models/index.js';

export const notificationController = {
  async getMyNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const notifications = NotificationModel.find({ recipientId: userId });
      const unreadCount = notifications.filter(n => !n.isRead).length;

      return res.status(200).json({
        success: true,
        unreadCount,
        count: notifications.length,
        notifications
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async markRead(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const notification = NotificationModel.findByIdAndUpdate(id, { isRead: true });
      return res.status(200).json({ success: true, message: 'Notification marked as read', notification });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async markAllRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const updatedCount = NotificationModel.markAllRead(userId);
      return res.status(200).json({ success: true, message: `Marked ${updatedCount} notifications as read` });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
