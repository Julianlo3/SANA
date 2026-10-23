import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { google } from 'googleapis';
import { EmailRepository } from './email.repository.js';
import { GmailOAuthController } from './gmail-oauth.controller.js';
import {
  EmailService,
  EMAIL_TRANSPORT_FACTORY,
  type EmailMessage,
  type EmailTransport,
  type GmailOptions,
} from './email.service.js';

function encodeHeader(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function encodeBody(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

function buildRawMessage(message: EmailMessage & { from: string }): string {
  const headers = [
    `From: ${message.from}`,
    `To: ${message.to}`,
    `Subject: ${encodeHeader(message.subject)}`,
    'MIME-Version: 1.0',
  ];
  if (!message.html) {
    return Buffer.from(
      [
        ...headers,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        encodeBody(message.text),
        '',
      ].join('\r\n'),
      'utf8',
    ).toString('base64url');
  }
  const boundary = `sana_${crypto.randomUUID()}`;
  return Buffer.from(
    [
      ...headers,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      encodeBody(message.text),
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      encodeBody(message.html),
      `--${boundary}--`,
      '',
    ].join('\r\n'),
    'utf8',
  ).toString('base64url');
}

function buildTransport(options: GmailOptions): EmailTransport {
  const auth = new google.auth.OAuth2(
    options.clientId,
    options.clientSecret,
    options.redirectUri,
  );
  auth.setCredentials({ refresh_token: options.refreshToken });
  const gmail = google.gmail({ version: 'v1', auth });
  return {
    sendMail: (message) =>
      gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: buildRawMessage(message) },
      }),
  };
}

@Module({
  imports: [ConfigModule],
  controllers: [GmailOAuthController],
  providers: [
    EmailRepository,
    EmailService,
    { provide: EMAIL_TRANSPORT_FACTORY, useValue: buildTransport },
  ],
  exports: [EmailService],
})
export class EmailModule {}
