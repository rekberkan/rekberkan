import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: this.configService.get<boolean>('email.secure'),
      auth: {
        user: this.configService.get<string>('email.auth.user'),
        pass: this.configService.get<string>('email.auth.pass'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('email.from'),
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, name: string) {
    const subject = 'Welcome to Kahade!';
    const html = `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for joining Kahade, your trusted P2P escrow platform.</p>
      <p>You can now start creating secure transactions.</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendTransactionNotification(to: string, transactionId: string, status: string) {
    const subject = `Transaction ${status}`;
    const html = `
      <h1>Transaction Update</h1>
      <p>Your transaction (ID: ${transactionId}) status has been updated to: <strong>${status}</strong></p>
      <p>Please check your dashboard for more details.</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendDisputeNotification(to: string, disputeId: string) {
    const subject = 'Dispute Created';
    const html = `
      <h1>Dispute Notification</h1>
      <p>A dispute (ID: ${disputeId}) has been created and is being reviewed by our team.</p>
      <p>We will notify you once it has been resolved.</p>
    `;

    return this.sendEmail(to, subject, html);
  }
}
