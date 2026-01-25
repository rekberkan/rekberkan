import { Request } from 'express';
import { IAuthUser } from './user.interface';

export interface IAuthRequest extends Request {
  user: IAuthUser;
}
