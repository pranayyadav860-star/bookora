// server/services/fast2sms.js
const axios = require('axios');

const sendOtp = async (phone, otp) => {
  const number = phone.replace('+91', '').replace(/\s/g, '').slice(-10);
  
  const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
    params: {
      authorization: process.env.FAST2SMS_API_KEY,
      route: 'otp',
      variables_values: otp,
      flash: 0,
      numbers: number,
    },
    headers: { 'cache-control': 'no-cache' }
  });

  return response.data;
};

module.exports = { sendOtp };