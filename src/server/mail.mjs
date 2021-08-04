import log from 'log';
import nodemailer from 'nodemailer';
import { APP_BASE } from '../constants.mjs';

const ADMIN_EMAIL = 'dilliamwye@gmail.com';

const SMTP_HOST = 'smtp.ethereal.email';
const SMTP_PORT = 587;

const EMAIL_PLACEHOLDER = '{{EMAIL}}';
const NAME_PLACEHOLDER = '{{NAME}}';
const REQUEST_ID_PLACEHOLDER = '{{REQUEST_ID}}';

const NEW_ROOM_REQUEST_SUBJECT = '[Jeopardye] New room link request';
const NEW_ROOM_REQUEST_TEMPLATE = `
A new Jeopardye room link request has just been submitted by ${NAME_PLACEHOLDER} (${EMAIL_PLACEHOLDER}).

Please visit ${APP_BASE} to approve or reject this request.

Yours,
Jeopardye Bot
`;

const ROOM_REQUEST_APPROVED_SUBJECT = `[Jeopardye] ${NAME_PLACEHOLDER}, your room link request has been approved!`;
const ROOM_REQUEST_APPROVED_TEMPLATE = `
Dear ${NAME_PLACEHOLDER},

Your request to create a new room in Jeopardye has just been approved!

Please visit ${APP_BASE}?req=${REQUEST_ID_PLACEHOLDER} and click "Create New Room" to create your room.
If you have never played Jeopardye before, you will have to create a player before you can create a room.

Once you have created your room, you can send the room code or a link to the room to your friends, and they can join your room and play with you.

Have fun playing trivia with your friends!

Best,
Jeopardye Bot
`;

const logger = log.get('jservice');

let transporter;

try {
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
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
    logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
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
