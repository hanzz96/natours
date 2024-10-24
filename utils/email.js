const nodemailer = require('nodemailer');

const sendEmail = async options => {
  //create transporter
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_SMTP_PASS
    }
  });

  //define email options

  const emailOptions = {
    from: 'Bot Natours<sysinfo@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    //html:
  };

  //send the email
  await transporter.sendMail(emailOptions);
};

module.exports = sendEmail;
