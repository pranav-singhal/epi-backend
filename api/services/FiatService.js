const fetch = require('node-fetch');

const getPaymentApiKeyByChain = (chain) => {
  const apiKey =  _.get(sails, ['config', 'chains', chain, 'payments', 'api', 'key'], '');
  if (_.isEmpty(apiKey)) {
    throw new Error(`API KEY NOT FOUND FOR CHAIN: ${chain}`);
  }

  return apiKey;
};

const getPaymentHeadersByChain = (chain) => {

  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${getPaymentApiKeyByChain(chain)}`  
  };
};

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1/';

module.exports = {

  validateVpa: async (_vpa, chain) => {
    const  requestOptions = {
      method: 'POST',
      headers: getPaymentHeadersByChain(chain),
      body: JSON.stringify({
        'vpa': _vpa
      }),
      redirect: 'follow'
    };
    try {
      const validateVpaResponse = await fetch(`${RAZORPAY_BASE_URL}/payments/validate/vpa`, requestOptions)
            .then(response => response.json());

      if (validateVpaResponse.error) {
        throw validateVpaResponse.error;
      }

      return validateVpaResponse;
    } catch (e) {
      console.log('invalid vpa input: ', e?.description);
      if(e?.reason === 'invalid_vpa') {
        return {success: false, customer_name: null};
      }
    }
  },

  initiatePayout: async (_vpa, amount, chain) => {
    const vpaDetails = await FiatService.validateVpa(_vpa, chain);

    if (!vpaDetails?.success) {
      return { success: false, message: 'invalid vpa passed' };
    }

    let fundAccountForVpa = await FiatService.getFundAccountForVpa(_vpa, chain);

    if (!fundAccountForVpa) {

      // 1. create new customer
      const newCustomerResponse = await FiatService.createCustomerForPayout(vpaDetails?.customer_name || FiatService.convertValidVpaToName(_vpa), chain);

      // 2. create vpa type fund account for the new customer
      const newFundAccountResponse = await FiatService.createVpaFundAccountForCustomer(newCustomerResponse?.id, _vpa, chain);

      // 3. set payout target to newly created fund account
      fundAccountForVpa = newFundAccountResponse?.id;

    }

    const payoutResponse = await FiatService.createPayoutToVpa(fundAccountForVpa, amount, chain);

    return { success: true, response: payoutResponse};

  },

  fetchAllFundAccounts: async (chain) => {

    const  requestOptions = {
      method: 'GET',
      headers: getPaymentHeadersByChain(chain)
    };
    const fundAccountsResponse = await fetch(`${RAZORPAY_BASE_URL}/fund_accounts`, requestOptions)
        .then(response => response.json());


    let vpaToFundAccountMapping = {};
    _.map(fundAccountsResponse?.items || [], _fundAccountObject => {
      vpaToFundAccountMapping[_.get(_fundAccountObject, 'vpa.address')] = _.get(_fundAccountObject, 'id');

    });
    return vpaToFundAccountMapping;
  },

  getFundAccountForVpa: async (_vpa, chain) => {
    const vpaToFundAccountMapping = await FiatService.fetchAllFundAccounts(chain);
    return vpaToFundAccountMapping[_vpa];
  },

  createPayoutToVpa: async (_fundAccountId, _amount, chain) => {

    const requestOptions = {
      method: 'POST',
      headers: getPaymentHeadersByChain(chain),
      body: JSON.stringify({
        account_number: '2323230079872777',
        fund_account_id: _fundAccountId,
        amount: _amount * 100, // converting inr to paisa
        currency: 'INR',
        mode: 'UPI',
        purpose: 'payout',
      }),
      redirect: 'follow'
    };

    return await fetch(`${RAZORPAY_BASE_URL}/payouts`, requestOptions)
      .then(res => res.json());

  },

  createCustomerForPayout: async (name, chain) => {
    const requestOptions = {
      method: 'POST',
      headers: getPaymentHeadersByChain(chain),
      body: JSON.stringify({
        name,
        type: 'payout-intent'
      }),
      redirect: 'follow'
    };

    return await fetch(`${RAZORPAY_BASE_URL}/contacts`, requestOptions)
      .then(response => response.json());

  },

  createVpaFundAccountForCustomer: async (customerId, vpa, chain) => {

    const requestOptions = {
      method: 'POST',
      headers: getPaymentHeadersByChain(chain),
      body: JSON.stringify({
        contact_id: customerId,
        account_type: 'vpa',
        vpa: {
          address: vpa
        }
      }),
      redirect: 'follow'
    };

    return await fetch(`${RAZORPAY_BASE_URL}/fund_accounts`, requestOptions)
      .then(response => response.json());
  },

  convertValidVpaToName: (_vpa) => _vpa.split('@')[0]
};

// TODO - add an end-point to get contract addresses along with chain numbers
// TODO - modify PayoutController.processTransactionEvents to take in chain ID
// TODO - in ContractFunctionService, load providers and signers for all chains in the config
//         POLYGON_NETWORK = "polygon-mumbai" - this is the netowrk name for polygon testnet
//         To be used for launching multiple providers and signers