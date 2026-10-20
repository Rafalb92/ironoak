export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  /** plain-text alternative: spam filters and text-only clients expect it */
  text: string;
}

export interface EmailSender {
  send(email: OutgoingEmail): Promise<void>;
}

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
