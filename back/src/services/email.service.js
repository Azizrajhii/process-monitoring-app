import nodemailer from 'nodemailer';

const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];

const getSmtpConfig = () => {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Configuration SMTP incomplete. Variables manquantes: ${missing.join(', ')}`,
    );
  }

  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM,
  };
};

export const sendResetPasswordEmail = async ({ to, fullName, resetUrl }) => {
  const smtp = getSmtpConfig();

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
  });

  const subject = 'Reinitialisation du mot de passe';
  const text = [
    `Bonjour ${fullName || ''}`.trim(),
    '',
    'Vous avez demande la reinitialisation de votre mot de passe.',
    `Lien: ${resetUrl}`,
    '',
    'Ce lien expire dans 15 minutes.',
  ].join('\n');

  const html = `
    <p>Bonjour ${fullName || ''},</p>
    <p>Vous avez demande la reinitialisation de votre mot de passe.</p>
    <p><a href="${resetUrl}">Cliquer ici pour reinitialiser le mot de passe</a></p>
    <p>Ce lien expire dans <strong>15 minutes</strong>.</p>
  `;

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject,
    text,
    html,
  });
};
