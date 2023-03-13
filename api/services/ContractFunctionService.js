const ethers = require('ethers');
const EPIGatewayABI = require('../../Contracts/EPIGateway/abi.json');
const EPIGatewayAddress = _.get(sails, 'config.epigateway.address');

const provider = new ethers.providers.InfuraProvider(
  'sepolia',
  '3e3bc546283842be8c2f1a9bcb2e1885' //process.env.INFURA_API_KEY
);
const signer = new ethers.Wallet(
    _.get(sails, 'config.contractadminwallet.pvtkey'),
    provider
);

const connectedContract = new ethers.Contract(EPIGatewayAddress, EPIGatewayABI, signer);

module.exports = {
  revertTransaction: async (
    txHash,
    payeeAddress
  ) => {

    console.log('***Error: reverting transaction for txHash:', txHash);

    const txDetails = await ContractFunctionService.getTransactionDetailsFromHash(txHash);

    if (txDetails?.value && txDetails?.value > 0 ) {

      /**
       * callStatic will throw error if contract method call is likely to revert.
       * if it reverts, actual contract method call will not be made
       */
      await connectedContract.callStatic.revertPayment(txHash, payeeAddress, { gasLimit: 100000, value: txDetails.value });

      const tx = await connectedContract.revertPayment(txHash, payeeAddress, { gasLimit: 100000, value: txDetails.value });

      return { tx };
    } else {
      throw {error: 'not sending transaction as value is too low'};
    }
  },

  getTransactionDetailsFromHash: async (_txHash) => provider.getTransaction(_txHash)
};
