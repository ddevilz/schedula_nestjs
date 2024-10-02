import { User } from './src/users/schemas/user.entity';
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
