import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { EmailRepository } from './email.repository.js';
import {
  EmailService,
  SMTP_TRANSPORT_FACTORY,
  type SmtpOptions,
  type SmtpTransport,
} from './email.service.js';

@Module({
  imports: [ConfigModule],
  providers: [
    EmailRepository,
    EmailService,
    {
      provide: SMTP_TRANSPORT_FACTORY,
      useValue: (options: SmtpOptions): SmtpTransport =>
        createTransport({
          url: options.url,
          tls: options.tls,
          connectionTimeout: options.connectionTimeout,
          greetingTimeout: options.greetingTimeout,
          socketTimeout: options.socketTimeout,
        } as never) as unknown as SmtpTransport,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}