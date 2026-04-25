const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

const sendEmail = async (options) => {
    if (!transporter) {
        console.log('\n[MAIL SERVICE MOCK]');
        console.log('To:', options.email);
        console.log('Subject:', options.subject);
        console.log('Message:', options.message || options.html);
        console.log('[END MAIL MOCK]\n');
        return;
    }

    const mailOptions = {
        from: `NexusAI <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
