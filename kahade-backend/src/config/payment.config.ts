import { registerAs } from '@nestjs/config';

export default registerAs('payment', () => ({
  gateway: process.env.PAYMENT_GATEWAY || 'midtrans',
  apiKey: process.env.PAYMENT_GATEWAY_API_KEY,
  secret: process.env.PAYMENT_GATEWAY_SECRET,
  callbackUrl: process.env.PAYMENT_CALLBACK_URL,
  successUrl: process.env.PAYMENT_SUCCESS_URL,
  failedUrl: process.env.PAYMENT_FAILED_URL,
  environment: process.env.PAYMENT_ENVIRONMENT || 'sandbox',
}));
