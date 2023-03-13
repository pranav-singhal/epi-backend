const ethers = require('ethers');
const EPIGatewayABI = require('../../Contracts/EPIGateway/abi.json');
const EPIGatewayAddress = '0x939750a4C8602B95f27E26a912537a9b4aE508ee';
const fetch = require('node-fetch');
const _ = require('@sailshq/lodash');
const VpaTransaction = require('../models/VpaTransaction');

const provider = new ethers.providers.WebSocketProvider(
    'wss://sepolia.infura.io/ws/v3/3e3bc546283842be8c2f1a9bcb2e1885'
);

const getEthToInr = async () => {
  try {
    let pricingChart = await fetch('https://api.wazirx.com/sapi/v1/tickers/24hr');
    pricingChart = await pricingChart.json();

    const ethToInr = _.filter(pricingChart, (_pricingObject) => {
      return _pricingObject.symbol === 'ethinr';
    });
    if (Array.isArray(ethToInr)) {
      return ethToInr[0]?.highPrice;
    }
    return {};

  } catch (e) {
    console.log('Unable to fetch price: ', e);
  }

};

const convertEthToInr = async (eth) => {
  let ethToInr = await getEthToInr();
  ethToInr = parseFloat(ethToInr);
  const ethAmount = parseFloat(eth);
  return ethToInr * ethAmount;
};

const convertBigNumberToInr = (_bigNumber) => ethers.utils.formatUnits(_bigNumber, 0);
const TOLERANCE = {
  'INR': 1
}; // allowed discrepancy in fiat between intended amount and actual amount;

module.exports = {

  handlePaymentEvent: async () => {
    console.log('listening to payment events on: ', EPIGatewayAddress);

    const contract = new ethers.Contract(EPIGatewayAddress, EPIGatewayABI, provider);

    contract.on('PaymentReceived', async (sender, receiver, amountInEth,fiatAmount, fiatCurrency,  ...argLast) => {
      const formattedAmountInEth = ethers.utils.formatEther( amountInEth );
      const transactionHash = _.get(argLast, '0.transactionHash', '');

      const pendingTransaction = await VpaTransaction.getTransactionFromTransactionHash(transactionHash);
      const isTransactionAlreadyRecorded = Boolean(pendingTransaction);

      /**
       * This is added to ensure if there are two parallel event listeners
       * for this contract, only one acts on an event at one time
       */
      if (isTransactionAlreadyRecorded) {

        return { success: false, message: 'transaction already recorded' };
      }

      const ethToInr = await convertEthToInr(formattedAmountInEth);
      const intendedAmountInInr = convertBigNumberToInr(fiatAmount);
      const diff = Math.abs(ethToInr - intendedAmountInInr);

      if (diff < TOLERANCE[fiatCurrency]) {
        try {
          const responseFromTable = await VpaTransaction.addEthToInrPendingTransaction(
            transactionHash,
            formattedAmountInEth,
            intendedAmountInInr
          );

          const payoutResponse = await FiatService.initiatePayout(
            receiver,
            intendedAmountInInr
          );

          if (!payoutResponse?.success) {

            await ContractFunctionService.revertTransaction(transactionHash, sender);

            await VpaTransaction.updateTransactionStatusToDeclined(
              transactionHash,
              { message: payoutResponse?.message || 'Your transaction was reverted'}
            );

            return { success: false, message: payoutResponse?.message };
          }

          // update the entry in the table  to completed
          await VpaTransaction.updateTransactionStatusToCompleted(transactionHash,
            {
              message: payoutResponse?.message || 'Your transaction was successful'
            }
          );

          return { success: true, message: payoutResponse?.message };
        } catch (e) {
          console.log('*** Error: ', JSON.stringify(e));
          await ContractFunctionService.revertTransaction(transactionHash, sender);

          await VpaTransaction.updateTransactionStatusToDeclined(
            transactionHash,
            { message: payoutResponse?.message || 'Your transaction was reverted'}
          );

          await VpaTransaction.updateTransactionStatusToDeclined(
            transactionHash,
            { message: 'Unknown error occured'}
          );
        }
      }

      await ContractFunctionService.revertTransaction(transactionHash, sender);

      await VpaTransaction.updateTransactionStatusToDeclined(
        transactionHash,
        { message: 'Unknown error occured'}
      );

    });
  }
};
