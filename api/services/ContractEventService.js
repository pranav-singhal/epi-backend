const ethers = require('ethers');
const EPIGatewayABI = require('../../Contracts/EPIGateway/abi.json');
const EPIGatewayAddress = '0x02cAfAc5Ff8C285Ff20c4a268360D4E2720BDA38';
const fetch = require('node-fetch');
const _ = require('@sailshq/lodash');

const provider = new ethers.providers.WebSocketProvider(
    'wss://sepolia.infura.io/ws/v3/3e3bc546283842be8c2f1a9bcb2e1885'
  );

const getEthToInr = async () => {
    try {
        let pricingChart = await fetch('https://api.wazirx.com/sapi/v1/tickers/24hr');
        pricingChart = await pricingChart.json();
        
        const ethToInr = _.filter(pricingChart, (_pricingObject) => {
            return _pricingObject.symbol === 'ethinr'
        });
        if (Array.isArray(ethToInr)) {
            return ethToInr[0].highPrice
        }
        return {}
        
    } catch (e) {
        console.log("Unable to fetch price: ", e)
    }
    
}

const convertEthToInr = async (eth) => {
    let ethToInr = await getEthToInr();
    ethToInr = parseFloat(ethToInr);
    ethAmount = parseFloat(eth);
    return ethToInr * ethAmount;
}

const convertBigNumberToInr = (_bigNumber) => ethers.utils.formatUnits(_bigNumber, 0);
const TOLERANCE = {
    'INR': 1
}; // allowed discrepency in fiat between intended amount and actual amount;

module.exports = {
    
    handlePaymentEvent: async () => {
        console.log("listening to payment events on: ", EPIGatewayAddress);
        
        const contract = new ethers.Contract(EPIGatewayAddress, EPIGatewayABI, provider);

        contract.on("PaymentReceived", async (sender, receiver, amountinEth,fiatAmount, fiatCurrency,  ...argLast) => {
            
            const formattedAmountInEth = ethers.utils.formatEther( amountinEth )
            const transactionHash = _.get(argLast, '0.transactionHash', '');
            const ethToInr = await convertEthToInr(formattedAmountInEth);
            const intendedAmountInInr = convertBigNumberToInr(fiatAmount);
            const diff = Math.abs(ethToInr - intendedAmountInInr);

            if (diff < TOLERANCE[fiatCurrency]) {

                console.log("***** Payment FLow initiated ****");
                const responseFromTable = await VpaTransaction.addEthToInrPendingTransaction(transactionHash, formattedAmountInEth, intendedAmountInInr)
                console.log("***** Payment Added to table, starting payout ****");
                const payoutResponse = await FiatService.initiatePayout(receiver, intendedAmountInInr);
                if (!payoutResponse?.succcess) {

                    // if payout is not successful, revert tht transaction
                    console.log("!!!!!!!! Initiating reversal on contract !!!!!!!!!!")
                    await ContractFunctionService.revertTransaction(transactionHash, sender);

                    console.log("!!!!!!!! Initiating reversal in table to declined !!!!!!!!!!")
                    await VpaTransaction.updateTransactionStatusToDeclined(
                        responseFromTable.id, 
                        {
                            message: payoutResponse?.message || 'Your transaction was reverted'
                        }
                    )
                }
            
             console.log({responseFromTable, payoutResponse});
            }
            else {
                console.log("!!!!!!!! Initiate Error FLow !!!!!!!!!!")   
            }
        })
    }
}