import { Router, Request, Response } from 'express';
import { validateBody } from '../utils/validation';
import { userSchemas } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { ContactsService } from '../services/contacts.service';
import { ValidationError } from '../types/errors';

export const contactsRouter = Router();

contactsRouter.use(requireAuth);

contactsRouter.post(
  '/contacts',
  validateBody(userSchemas.uploadContacts),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User ID not found in request');
    }

    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new ValidationError('At least one contact is required');
    }

    try {
      await ContactsService.uploadContacts(userId, contacts);

      res.json({
        success: true,
        message: 'Contacts uploaded successfully',
        data: {
          count: contacts.length,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload contacts';
      throw new ValidationError(errorMessage);
    }
  })
);

contactsRouter.get(
  '/contacts',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User ID not found in request');
    }

    try {
      const contacts = await ContactsService.getUserContacts(userId);

      res.json({
        success: true,
        message: 'Contacts retrieved successfully',
        data: {
          contacts,
          count: contacts.length,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve contacts';
      throw new ValidationError(errorMessage);
    }
  })
);

contactsRouter.get(
  '/connections',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User ID not found in request');
    }

    try {
      const connections = await ContactsService.getConnectedUsers(userId);

      res.json({
        success: true,
        message: 'Connections retrieved successfully',
        data: {
          connections,
          count: connections.length,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve connections';
      throw new ValidationError(errorMessage);
    }
  })
);
