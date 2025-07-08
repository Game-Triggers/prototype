import { Request } from 'express';

/**
 * Extended Request interface that includes user data from JWT token
 */
export interface RequestWithUser extends Request {
  user?: { userId: string; email: string; role: string };
}
