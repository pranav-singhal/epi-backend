// Helper Functions
const fetch = require('node-fetch');

const ethers = require('ethers');

const provider = new ethers.providers.InfuraWebSocketProvider(
  'sepolia', '3e3bc546283842be8c2f1a9bcb2e1885'
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

const getAmountAfterReducingFees = (_sentAmountInEth) => {
  return _sentAmountInEth * 0.99; // current fees set at 1%
};

// TODO - move this to config
const TOLERANCE = {
  'INR': 1
};

// Helper functions end

module.exports = {
  validateVpa: async (req, res) => {
    const vpa = _.get(req, 'body.vpa');
    const vpaDetails = await FiatService.validateVpa(vpa);
    return res.json(vpaDetails);
  },

  generateSignatureForTransaction: async (req, res) => {
    const senderAddress = _.get(req, 'body.senderAddress');
    const amount = _.get(req, 'body.amount');

    const signedTransactionResponse = await Web3Service.generateSignedTransaction(senderAddress, amount);
    return res.json(signedTransactionResponse);
  },

  processTransactionEvents: async (req, res) => {
    // todo - add a check that transaction has is for the right contract address
    const transactionHash = _.get(req, 'body.txHash');
    const pendingTransaction = await VpaTransaction.getTransactionFromTransactionHash(transactionHash);
    const isTransactionAlreadyRecorded = Boolean(pendingTransaction);

    /**
       * This is added to ensure that same transaction is not used to
       * create multiple payouts
       */
    if (isTransactionAlreadyRecorded) {

      return res.json({ success: false, message: 'transaction already recorded' });
    }

    const txRecipt = await ContractFunctionService.getTransactionDetailsFromHash(transactionHash);

    if (!txRecipt) {
      return res.json({ success: false, message: 'Invalid transaction has passed' });
    }

    const logs = txRecipt.logs;
    const parsedLogs = await ContractFunctionService.parseLogs(logs);

    const amountInEth = ethers.utils.formatEther(_.get(parsedLogs, '0.paymentAmount.value'));
    const fiatCurrencyUnit = _.get(parsedLogs, '0.intentCurrency.value');
    const sender = _.get(parsedLogs, '0.sender.value');
    const intendedAmountInEth = getAmountAfterReducingFees(amountInEth); // adjusted for fees


    // Checking difference between the amount sent in INR and the amount sent in ETH
    // if it is withing allowed tolerance, we process the transaction
    const ethToInr = await convertEthToInr(intendedAmountInEth);
    const intendedAmountInInr = _.get(parsedLogs, '0.intentAmount.value'); // fiat amount sent in
    const diff = Math.abs(ethToInr - parseFloat(intendedAmountInInr));
    const allowedDiff = TOLERANCE[fiatCurrencyUnit] || 0;

    if (diff < allowedDiff) {
      try {
        await VpaTransaction.addEthToInrPendingTransaction(
          transactionHash,
          intendedAmountInEth,
          intendedAmountInInr
        );

        const payoutResponse = await FiatService.initiatePayout(
          _.get(parsedLogs, '0.reciever.value'), // reciever
          intendedAmountInInr
        );

        if (!payoutResponse?.success) {
          await ContractFunctionService.revertTransaction(transactionHash, sender);

          // mark the transaction as declined
          await VpaTransaction.updateTransactionStatusToDeclined(
            transactionHash,
            { message: payoutResponse?.message || 'Your transaction was reverted' }
          );

          return res.json({ success: false, message: payoutResponse?.message });
        }

        // update the entry in the table  to completed
        await VpaTransaction.updateTransactionStatusToCompleted(transactionHash,
          {
            message: payoutResponse?.message || 'Your transaction was successful'
          }
        );

        console.log(`Success: Payout successful for: ${transactionHash} `)
        return res.json({ success: true, message: payoutResponse?.message || 'Payout successful' });


      } catch (error) {
        console.log('*** Error: ', JSON.stringify(error));
        await ContractFunctionService.revertTransaction(transactionHash, sender);
        await VpaTransaction.updateTransactionStatusToDeclined(
          transactionHash,
          { message: 'Unknown error occured' }
        );
      }
    }

    await ContractFunctionService.revertTransaction(transactionHash, sender);

    await VpaTransaction.updateTransactionStatusToDeclined(
      transactionHash,
      { message: 'Unknown error occured' }
    );

    return res.json({ success: false, message: 'Transaction reverted' });

  }
};
