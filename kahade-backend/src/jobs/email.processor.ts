import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from '@integrations/email/email.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job) {
    this.logger.debug(`Processing email job: ${job.id}`);
    const { to, subject, html } = job.data;

    try {
      await this.emailService.sendEmail(to, subject, html);
      this.logger.log(`Email sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  @Process('send-welcome-email')
  async handleWelcomeEmail(job: Job) {
    const { email, name } = job.data;
    try {
      await this.emailService.sendWelcomeEmail(email, name);
      this.logger.log(`Welcome email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`);
      throw error;
    }
  }

  @Process('send-transaction-notification')
  async handleTransactionNotification(job: Job) {
    const { email, transactionId, status } = job.data;
    try {
      await this.emailService.sendTransactionNotification(email, transactionId, status);
      this.logger.log(`Transaction notification sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send transaction notification: ${error.message}`);
      throw error;
    }
  }
}
