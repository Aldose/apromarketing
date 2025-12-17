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

export const sendMail = async ( subject, text) => {
  return new Promise(async(resolve, reject) => {
    try {
      const info = await transporter.sendMail({
        from: MAILER_EMAIL,
        to: MAILER_RECIPIENT,
        subject,
        text,
      });
      resolve(info);
    } catch (error) {
      reject(error);
    }
  })   
}