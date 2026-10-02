import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Options as SmtpTransportOptions } from 'nodemailer/lib/smtp-transport/index.js';
import { EmailRepository } from './email.repository.js';
import {
  EmailService,
  SMTP_TRANSPORT_FACTORY,
  type SmtpOptions,
  type SmtpTransport,
} from './email.service.js';

function buildTransport(options: SmtpOptions): SmtpTransport {
  const transportOptions: SmtpTransportOptions = {
    host: options.host,
    port: options.port,
    secure: true,
    requireTLS: true,
    ...(options.auth ? { auth: options.auth } : {}),
    tls: options.tls,
    connectionTimeout: options.connectionTimeout,
    greetingTimeout: options.greetingTimeout,
    socketTimeout: options.socketTimeout,
  };
  return createTransport(transportOptions) as unknown as SmtpTransport;
}

@Module({
  imports: [ConfigModule],
  providers: [
    EmailRepository,
    EmailService,
    { provide: SMTP_TRANSPORT_FACTORY, useValue: buildTransport },
  ],
  exports: [EmailService],
})
export class EmailModule {}