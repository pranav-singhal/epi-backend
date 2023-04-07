const ethers = require('ethers');
const _ = require('@sailshq/lodash');
const EPIGatewayABI = require('../../Contracts/EPIGateway/abi.json');

const providers = _.reduce(sails.config.chains, (result, value, key) => {
  result[key] = new ethers.providers.JsonRpcProvider(
    `https://${value.infura.network}.infura.io/v3/${value.infura.apikey}`
  );

  return result;
}, {});

const signers = _.reduce(sails.config.chains, (result, value, key) => {
  result[key] = new ethers.Wallet(value.gateway.contract.admin.pvtkey);

  return result;
}, {});

const connectedContracts = _.reduce(sails.config.chains, (result, value, key) => {
  result[key] = new ethers.Contract(value.gateway.contract.address, EPIGatewayABI, signers[key]);

  return result;
}, {});


const contractInterface = new ethers.utils.Interface(EPIGatewayABI);

const convertBigNumberToLargeInt = (_bigNumber) => ethers.utils.formatUnits(_bigNumber, 0);

const getParseEventValues = (_eventObject) => {
  const _eventInptus = _.get(_eventObject, 'eventFragment.inputs', []);
  const _eventArgs = _.get(_eventObject, 'args', []);

  let parsedEventDetails = {};

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
    chain,
    payeeAddress
  ) => {

    console.log('***Error: reverting transaction for txHash:', txHash);

    const txDetailsWithVaue = await ContractFunctionService.getTransactionDetailsWithValueFromHash(txHash, chain);

    const txValue = parseFloat(convertBigNumberToLargeInt(txDetailsWithVaue.value));
    if (txValue && txValue > 0) {

      /**
       * callStatic will throw error if contract method call is likely to revert.
       * if it reverts, actual contract method call will not be made
       */
      await connectedContracts[chain].callStatic.revertPayment(txHash, payeeAddress, { gasLimit: 100000, value: txValue });

      const tx = await connectedContracts[chain].revertPayment(txHash, payeeAddress, { gasLimit: 100000, value: txValue });

      return { tx };
    } else {
      throw { error: 'not sending transaction as value is too low' };
    }
  },

  getTransactionDetailsFromHash: async (_txHash, chain) => {
    return providers[chain].getTransactionReceipt(_txHash)
  },

  getTransactionDetailsWithValueFromHash: async (_txHash, chain) => providers[chain].getTransaction(_txHash),

  parseLogs: async (_logs) => {
    let resolvedLogs = [];
    await Promise.all(_.map(_logs, async (_log) => {

      try {
        const _resolvedLog = await contractInterface.parseLog(_log);
        const eventObject = getParseEventValues(_resolvedLog);
        resolvedLogs.push(eventObject);
      } catch (error) {
        console.error(error);
      }

    }));

    return resolvedLogs;
  },

  getPayoutContractsWithAbi: () => {
    const connectedContracts = _.reduce(sails.config.chains, (result, value, key) => {
      result[key] = value.gateway.contract.address;
      return result;
    }, {});

    return {contracts: connectedContracts, abi: EPIGatewayABI};
  }
};

