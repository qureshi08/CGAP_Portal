import nodemailer from 'nodemailer';

/**
 * Same SMTP pattern as the Recruitment Portal (Office 365).
 * Requires EMAIL_USER / EMAIL_PASS in .env.local.
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!,
    },
    tls: { ciphers: 'SSLv3' },
});

export interface TemplatePlaceholders {
    fellow_name?: string;
    batch_name?: string;
    phase_name?: string;
    module_name?: string;
    mentor_name?: string;
    score?: string | number;
    [key: string]: string | number | undefined;
}

/** Replaces {{placeholder}} tokens in a template string. Unknown tokens are left as-is. */
export function renderTemplate(text: string, placeholders: TemplatePlaceholders): string {
    return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
        const value = placeholders[key];
        return value === undefined ? match : String(value);
    });
}

export async function sendTemplatedEmail(opts: {
    to: string;
    subjectTemplate: string;
    bodyTemplate: string;
    placeholders: TemplatePlaceholders;
}) {
    const subject = renderTemplate(opts.subjectTemplate, opts.placeholders);
    const html = renderTemplate(opts.bodyTemplate, opts.placeholders).replace(/\n/g, '<br/>');

    await transporter.sendMail({
        from: `"CGAP" <${process.env.EMAIL_USER}>`,
        to: opts.to,
        subject,
        html,
    });

    return { subject };
}
