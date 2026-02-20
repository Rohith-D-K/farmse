import twilio from 'twilio';

let twilioWarningLogged = false;

const getTwilioConfig = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_FROM_PHONE;
    const defaultCountryCode = process.env.TWILIO_DEFAULT_COUNTRY_CODE || '+91';

    if (!accountSid || !authToken || !fromPhone) {
        if (!twilioWarningLogged) {
            console.warn('Twilio SMS is disabled. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_PHONE.');
            twilioWarningLogged = true;
        }
        return null;
    }

    return { accountSid, authToken, fromPhone, defaultCountryCode };
};

const normalizePhoneNumber = (phone: string, defaultCountryCode: string) => {
    let normalized = phone.trim().replace(/[^\d+]/g, '');

    if (normalized.startsWith('00')) {
        normalized = `+${normalized.slice(2)}`;
    }

    if (!normalized.startsWith('+')) {
        normalized = `${defaultCountryCode}${normalized.replace(/^0+/, '')}`;
    }

    return normalized;
};

export const sendSms = async (to: string, body: string) => {
    const config = getTwilioConfig();

    if (!config) {
        return { sent: false, reason: 'not_configured' as const };
    }

    const client = twilio(config.accountSid, config.authToken);
    const recipient = normalizePhoneNumber(to, config.defaultCountryCode);

    await client.messages.create({
        from: config.fromPhone,
        to: recipient,
        body
    });

    return { sent: true as const };
};
