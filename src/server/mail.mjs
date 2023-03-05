import log from 'log';
import nodemailer from 'nodemailer';
import config from '../config.json' assert { type: 'json' };
import { APP_BASE } from '../constants.mjs';

const ADMIN_EMAIL = config.admin.email;

const SMTP_HOST = config.smtp.host;
const SMTP_PORT = config.smtp.port;
const SMTP_USER = config.smtp.user;
const SMTP_PASSWORD = config.smtp.password;

const TEST_SMTP_HOST = 'smtp.ethereal.email';

const EMAIL_PLACEHOLDER = '{{EMAIL}}';
const NAME_PLACEHOLDER = '{{NAME}}';
const PLAYER_ID_PLACEHOLDER = '{{PLAYER_ID}}';
const REQUEST_ID_PLACEHOLDER = '{{REQUEST_ID}}';
const ROOM_PLACEHOLDER = '{{ROOM}}';

const EMAIL_SUBJECT_PREFIX = '[Jeopardye]';

const ADMIN_EMAIL_SIGNATURE = '\nYours,\nJeopardye Bot\n';
const EMAIL_SIGNATURE = '\nBest,\nJeopardye Bot\n';

const NEW_ROOM_REQUEST_SUBJECT = `${EMAIL_SUBJECT_PREFIX} New room link request`;
const NEW_ROOM_REQUEST_TEMPLATE = `
A new Jeopardye room link request has just been submitted by ${NAME_PLACEHOLDER} (${EMAIL_PLACEHOLDER}).

Please visit ${APP_BASE} to approve or reject this request.
${ADMIN_EMAIL_SIGNATURE}`;

const ROOM_REQUEST_APPROVED_SUBJECT = `${EMAIL_SUBJECT_PREFIX} ${NAME_PLACEHOLDER}, your room link request has been approved!`;
const ROOM_REQUEST_APPROVED_TEMPLATE = `
Dear ${NAME_PLACEHOLDER},

Your request to create a new room in Jeopardye has just been approved!

Please visit ${APP_BASE}?req=${REQUEST_ID_PLACEHOLDER} and click "Create New Room" to create your room. If you have never played Jeopardye before, you will have to create a player before you can create a room.

Once you have created your room, you can send the room code or a link to the room to your friends, and they can join your room and play with you.

Have fun playing trivia with your friends!
${EMAIL_SIGNATURE}`;

const ROOM_CREATED_SUBJECT = `${EMAIL_SUBJECT_PREFIX} Room ${ROOM_PLACEHOLDER} created successfully`;
const ROOM_CREATED_TEMPLATE = `
Dear ${NAME_PLACEHOLDER},

Your room ${ROOM_PLACEHOLDER} is now ready to go!

When you're ready, visit ${APP_BASE}/p/${ROOM_PLACEHOLDER} to play unlimited games of trivia with your friends!

This link will always be yours, so feel free to bookmark it, or send it to others so they can play with you.
${EMAIL_SIGNATURE}`;

const PLAYER_REGISTRATION_SUBJECT = `${EMAIL_SUBJECT_PREFIX} Welcome to Jeopardye, ${NAME_PLACEHOLDER}!`;
const PLAYER_REGISTRATION_TEMPLATE = `
Dear ${NAME_PLACEHOLDER},

Thank you for registering your account with Jeopardye! By registering with your email address, you will be able to restore your player account if you ever lose it in the future.

If you did not recently create an account at ${APP_BASE}, please contact the administrator at ${ADMIN_EMAIL} to report potential abuse.

May all the daily doubles be in your favor!
${EMAIL_SIGNATURE}`;

const PLAYER_EMAIL_UPDATED_SUBJECT = `${EMAIL_SUBJECT_PREFIX} Your email address was changed on Jeopardye`;
const PLAYER_EMAIL_UPDATED_TEMPLATE = `
Dear ${NAME_PLACEHOLDER},

We recently received a request to change the email address on your Jeopardye account from this address to ${EMAIL_PLACEHOLDER}. If you made this request, no further action is required.

If you did not make this request, please contact the administrator at ${ADMIN_EMAIL} to report potential abuse.

May all your potables be potent!
${EMAIL_SIGNATURE}
`;

const PLAYER_RETRIEVAL_SUBJECT = `${EMAIL_SUBJECT_PREFIX} ${NAME_PLACEHOLDER}, here's your player restoration link!`;
const PLAYER_RETRIEVAL_TEMPLATE = `
Dear ${NAME_PLACEHOLDER},

We recently received a request to restore your previous player account on Jeopardye. If this was you, please use the link below to restore your account:

${APP_BASE}?pid=${PLAYER_ID_PLACEHOLDER}

If you did not make this request, please contact the administrator at ${ADMIN_EMAIL} to report potential abuse.

As always, remember to wager wisely!
${EMAIL_SIGNATURE}`;

const logger = log.get('mail');

let transporter;

try {
  let user, password;
  if (SMTP_HOST === TEST_SMTP_HOST) {
    const testAccount = await nodemailer.createTestAccount();
    user = testAccount.user;
    password = testAccount.pass;
  } else {
    user = SMTP_USER;
    password = SMTP_PASSWORD;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: user,
      pass: password,
    },
  });
} catch (e) {
  logger.error(`Failed to initialize mail transport: ${e}`);
}

export async function sendMail(to, subject, body) {
  if (!transporter) {
    logger.error('Failed to send mail: mail transport was not initialized successfully');
    return;
  }
  const message = {
    from: '"Jeopardye" <noreply@jeopardye.com>',
    to: to,
    subject: subject,
    text: body,
    // html: "<b>Hello world?</b>",
  };
  try {
    const info = await transporter.sendMail(message);
    logger.info(`Successfully sent mail to "${to}" with subject "${subject}".`);
    const previewURL = nodemailer.getTestMessageUrl(info);
    if (previewURL) {
      logger.info(`Preview URL: ${previewURL}`);
    }
  } catch (e) {
    logger.error(`Failed to send mail to "${to}" with subject "${subject}": ${e}`);
  }
}

export async function sendNewRoomLinkRequestMessage(roomLinkRequest) {
  const { email, name } = roomLinkRequest;
  const body = NEW_ROOM_REQUEST_TEMPLATE.replaceAll(EMAIL_PLACEHOLDER, email).replaceAll(NAME_PLACEHOLDER, name);
  await sendMail(ADMIN_EMAIL, NEW_ROOM_REQUEST_SUBJECT, body);
}

export async function sendRoomLinkRequestApprovedMessage(roomLinkRequest) {
  const { email, name, requestID } = roomLinkRequest;
  const subject = ROOM_REQUEST_APPROVED_SUBJECT.replaceAll(NAME_PLACEHOLDER, name);
  const body = ROOM_REQUEST_APPROVED_TEMPLATE.replaceAll(NAME_PLACEHOLDER, name).replaceAll(REQUEST_ID_PLACEHOLDER, requestID);
  await sendMail(email, subject, body);
}

export async function sendRoomCreatedMessage(roomCode, roomLinkRequest) {
  const { email, name } = roomLinkRequest;
  const subject = ROOM_CREATED_SUBJECT.replaceAll(ROOM_PLACEHOLDER, roomCode);
  const body = ROOM_CREATED_TEMPLATE.replaceAll(NAME_PLACEHOLDER, name).replaceAll(ROOM_PLACEHOLDER, roomCode);
  await sendMail(email, subject, body);
}

export async function sendPlayerRegistrationMessage(player) {
  const { email, name } = player;
  const subject = PLAYER_REGISTRATION_SUBJECT.replaceAll(NAME_PLACEHOLDER, name);
  const body = PLAYER_REGISTRATION_TEMPLATE.replaceAll(NAME_PLACEHOLDER, name);
  await sendMail(email, subject, body);
}

export async function sendPlayerEmailUpdatedMessage(name, newEmail, prevEmail) {
  newEmail = newEmail || '';
  prevEmail = prevEmail || '';
  if (newEmail.length === 0 || prevEmail.length === 0) {
    return;
  }
  const subject = PLAYER_EMAIL_UPDATED_SUBJECT.replaceAll(NAME_PLACEHOLDER, name);
  const body = PLAYER_EMAIL_UPDATED_TEMPLATE.replaceAll(NAME_PLACEHOLDER, name).replaceAll(EMAIL_PLACEHOLDER, newEmail);
  await sendMail(prevEmail, subject, body);
}

export async function sendPlayerRetrievalMessage(player) {
  const { email, name, playerID } = player;
  const subject = PLAYER_RETRIEVAL_SUBJECT.replaceAll(NAME_PLACEHOLDER, name);
  const body = PLAYER_RETRIEVAL_TEMPLATE.replaceAll(NAME_PLACEHOLDER, name).replaceAll(PLAYER_ID_PLACEHOLDER, playerID);
  await sendMail(email, subject, body);
}
