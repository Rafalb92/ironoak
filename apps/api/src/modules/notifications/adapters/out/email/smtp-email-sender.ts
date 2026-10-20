import { createTransport, type Transporter } from 'nodemailer';
import type {
  EmailSender,
  OutgoingEmail,
} from '../../../application/ports/email-sender.port';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
}

/**
 * One adapter for every SMTP server: Mailpit locally, Gmail (app password)
 * in production, any other provider later — a change of env, not of code.
 */
export class SmtpEmailSender implements EmailSender {
  private readonly transporter: Transporter;

  constructor(private readonly config: SmtpConfig) {
    this.transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      // Mailpit accepts anonymous mail; real providers need credentials
      auth: config.user
        ? { user: config.user, pass: config.password }
        : undefined,
    });
  }

  async send(email: OutgoingEmail): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  }
}
