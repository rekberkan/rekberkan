import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT, 10) || 587,
  user: process.env.MAIL_USER,
  password: process.env.MAIL_PASSWORD,
  from: process.env.MAIL_FROM || 'noreply@kahade.com',
  fromName: process.env.MAIL_FROM_NAME || 'Kahade',
}));
