const ethers = require('ethers');
const _ = require('@sailshq/lodash');
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
const contractInterface = new ethers.utils.Interface(EPIGatewayABI);

const convertBigNumberToLargeInt = (_bigNumber) => ethers.utils.formatUnits(_bigNumber, 0);

const getParseEventValues = (_eventObject) => {
  const _eventInptus = _.get(_eventObject, 'eventFragment.inputs', []);
  const _eventArgs = _.get(_eventObject, 'args', []);

  let parsedEventDetails = {}
  if (Array.isArray(_eventInptus) && _eventInptus.length) {

    _.forEach(_eventInptus, (_eventInput, _index) => {
      const _eventType = _eventInput.type;
      parsedEventDetails[_eventInput?.name] = {
        type: _eventType,
        value: _eventType === 'uint256' ?
          convertBigNumberToLargeInt(_eventArgs[_index]) : _eventArgs[_index]
      };
      console.log(parsedEventDetails)
    });
  }

  return parsedEventDetails;
};

module.exports = {
  revertTransaction: async (
    txHash,
    payeeAddress
  ) => {

    console.log('***Error: reverting transaction for txHash:', txHash);

    const txDetails = await ContractFunctionService.getTransactionDetailsFromHash(txHash);

    const txDetailsWithVaue = await ContractFunctionService.getTransactionDetailsWithValueFromHash(txHash);

    const txValue = parseFloat(convertBigNumberToLargeInt(txDetailsWithVaue.value));
    if (txValue && txValue > 0) {

      /**
       * callStatic will throw error if contract method call is likely to revert.
       * if it reverts, actual contract method call will not be made
       */
      await connectedContract.callStatic.revertPayment(txHash, payeeAddress, { gasLimit: 100000, value: txValue });

      const tx = await connectedContract.revertPayment(txHash, payeeAddress, { gasLimit: 100000, value: txValue });

      return { tx };
    } else {
      throw { error: 'not sending transaction as value is too low' };
    }
  },

  getTransactionDetailsFromHash: async (_txHash) => provider.getTransactionReceipt(_txHash),

  getTransactionDetailsWithValueFromHash: async (_txHash) => provider.getTransaction(_txHash),

  parseLogs: async (_logs) => {
    let resolvedLogs = [];
    await Promise.all(_.map(_logs, async (_log) => {

      const _resolvedLog = await contractInterface.parseLog(_log);
      const eventObject = getParseEventValues(_resolvedLog);
      resolvedLogs.push(eventObject);

    }));

    return resolvedLogs;
  }
};

