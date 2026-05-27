import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, config.jwt.secret, options);
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwt.secret as any) as JWTPayload;
}
