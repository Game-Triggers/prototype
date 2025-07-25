import { IUser, UserRole } from '@schemas/user.schema';

declare global {
  namespace Express {
    interface Request {
      user:
        | IUser
        | {
            userId: string;
            email: string;
            role: UserRole;
          };
    }
  }
}

export {};
