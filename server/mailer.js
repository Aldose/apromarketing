const MAILER_EMAIL = Bun.env.MAILER_EMAIL;
const MAILER_PASSWORD = Bun.env.MAILER_PASSWORD;
const MAILER_RECIPIENT = Bun.env.MAILER_RECIPIENT;
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "redbull.mxrouting.net",
  port: 465,
  secure: true,
  auth: {
    user: MAILER_EMAIL,
    pass: MAILER_PASSWORD,
  },
});

export const sendMail = async (emailData) => {
  return new Promise(async(resolve, reject) => {
    try {
      // Handle both old format (subject, text) and new format (object)
      let mailOptions;

      if (typeof emailData === 'string') {
        // Legacy format: sendMail(subject, text)
        const subject = emailData;
        const text = arguments[1];
        mailOptions = {
          from: MAILER_EMAIL,
          to: MAILER_RECIPIENT,
          subject,
          text,
        };
      } else {
        // New format: sendMail({to, subject, text, replyTo})
        mailOptions = {
          from: MAILER_EMAIL,
          to: emailData.to || MAILER_RECIPIENT,
          subject: emailData.subject,
          text: emailData.text,
          replyTo: emailData.replyTo || MAILER_EMAIL
        };
      }

      const info = await transporter.sendMail(mailOptions);
      resolve(info);
    } catch (error) {
      reject(error);
    }
  })
}