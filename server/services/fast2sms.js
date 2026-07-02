// server/services/fast2sms.js
const axios = require('axios');

const API_KEY = process.env.FAST2SMS_API_KEY;
const BASE_URL = 'https://www.fast2sms.com/dev/bulkV2';

if (!API_KEY) {
  console.warn('[fast2sms] WARNING: FAST2SMS_API_KEY is not set — phone OTPs will fail to send.');
}

/**
 * Send an OTP via Fast2SMS's managed OTP route.
 * @param {string} phone - 10-digit Indian mobile number, no +91 prefix
 * @param {string|number} otp
 * @returns {Promise<object>} Fast2SMS API response
 */
async function sendOtp(phone, otp) {
  const response = await axios.post(
    BASE_URL,
    {
      variables_values: String(otp),
      route: 'otp',
      numbers: String(phone),
    },
    {
      headers: {
        authorization: API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

module.exports = { sendOtp };