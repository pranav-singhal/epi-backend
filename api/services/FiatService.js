// Full workflow   
const fetch = require('node-fetch');

const RAZORPAY_API_KEY = 'cnpwX3Rlc3RfVTQzT2lWZmtGTHpYMXo6cnJzVlRoNDNDeHFmMDVuV2RXWXVRMHNj'
// const BASE_AUTH_HEADERS = new Headers();
// myHeaders.append("Authorization", `BASIC ${RAZORPAY_API_KEY}`);
// myHeaders.append("Content-Type", "application/json");

const BASE_AUTH_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": `Basic ${RAZORPAY_API_KEY}`
};


module.exports = {

    validateVpa: async (_vpa) => {
        const raw = JSON.stringify({
            "vpa": _vpa
          });
          
          console.log(BASE_AUTH_HEADERS)
        const  requestOptions = {
            method: 'POST',
            headers: BASE_AUTH_HEADERS,
            body: raw,
            redirect: 'follow'
          };
          try {
            const validateVpaResponse = await fetch("https://api.razorpay.com/v1/payments/validate/vpa", requestOptions)
            .then(response => response.json())

            if (validateVpaResponse.error) {
                throw validateVpaResponse.error;
            }
  
            return validateVpaResponse;
          } catch (e) {
              console.log("invalid vpa input: ", e);
            if(e?.reason === 'invalid_vpa') {
                return {success: false, customer_name: null}
            }
          }
          
        
    },

    initiatePayout: async (_vpa, amount) => {
        const vpaDetails = await FiatService.validateVpa(_vpa)

        if (!vpaDetails?.success) {
            return {success: false, message: 'invalid vpa passed'}
        }

        // fetch customer with vpa
        // if no customer
        // create customer
        // create payout to customer

    }
}