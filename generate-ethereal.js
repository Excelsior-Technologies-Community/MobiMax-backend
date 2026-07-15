import nodemailer from 'nodemailer';

async function generate() {
  const account = await nodemailer.createTestAccount();
  console.log('ETHEREAL_USER=' + account.user);
  console.log('ETHEREAL_PASS=' + account.pass);
}
generate();
