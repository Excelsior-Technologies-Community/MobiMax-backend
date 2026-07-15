import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const testEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'aadia2435@gmail.com',
        pass: 'degjiviubicvpakp',
      },
    });

    const info = await transporter.sendMail({
      from: '"Test" <aadia2435@gmail.com>',
      to: 'aadia2435@gmail.com',
      subject: 'SMTP Test',
      text: 'Testing SMTP connection...',
    });
    console.log('Success:', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
};

testEmail();
