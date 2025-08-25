import { Request } from 'express';
import {
  EurekaRole,
  Permission,
  Portal,
} from '../../../../../lib/eureka-roles';

/**
 * Extended request interface with user and role information
 */
export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    [key: string]: any;
  };
  userRole?: EurekaRole;
  userPortal?: Portal;
  userPermissions?: Permission[];
}

/**
 * Enhanced user interface for type safety
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string;
  authProvider?: string;
  authProviderId?: string;
}
