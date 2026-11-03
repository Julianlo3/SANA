import { randomUUID } from 'node:crypto';
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
import { EMAIL_INLINE_ASSETS, type EmailInlineAsset } from './email-assets.js';

function encodeHeader(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function encodeBody(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

/**
 * Construye el payload MIME raw en formato base64url para la API de Gmail.
 * Soporta text/plain, multipart/alternative y multipart/related con CID para imágenes inline.
 */
export function buildRawMessage(message: EmailMessage & { from: string }): string {
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

  const referencedAssets: EmailInlineAsset[] = [];
  for (const [cid, asset] of Object.entries(EMAIL_INLINE_ASSETS)) {
    if (message.html.includes(`cid:${cid}`)) {
      referencedAssets.push(asset);
    }
  }

  if (referencedAssets.length === 0) {
    const boundary = `sana_${randomUUID()}`;
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

  const relatedBoundary = `sana_rel_${randomUUID()}`;
  const altBoundary = `sana_alt_${randomUUID()}`;

  const lines: string[] = [
    ...headers,
    `Content-Type: multipart/related; boundary="${relatedBoundary}"; type="text/html"`,
    '',
    `--${relatedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    `--${altBoundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBody(message.text),
    '',
    `--${altBoundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBody(message.html),
    '',
    `--${altBoundary}--`,
  ];

  for (const asset of referencedAssets) {
    const formattedBase64 =
      asset.base64.match(/.{1,76}/g)?.join('\r\n') || asset.base64;
    lines.push(
      '',
      `--${relatedBoundary}`,
      `Content-Type: ${asset.contentType}; name="${asset.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-ID: <${asset.cid}>`,
      `Content-Disposition: inline; filename="${asset.filename}"`,
      '',
      formattedBase64,
    );
  }

  lines.push('', `--${relatedBoundary}--`, '');

  return Buffer.from(lines.join('\r\n'), 'utf8').toString('base64url');
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
export class EmailModule { }
