const PushAPI = require('@pushprotocol/restapi');
const ethers = require('ethers');
const NOTIFICATION_CHANNEL = '0xBA36124E8af635d9d32C4cC49802cacade133a5F';
const NOTIFICATION_CHANNEL_PVT_KEY = '889fa6ff54d4190253a6b1c59bd08e3dc03485478dd93b2fff8e4600bde06b42';
const channelSigner = new ethers.Wallet(NOTIFICATION_CHANNEL_PVT_KEY);
const notificationIdentifier = 'wallet-notif';

module.exports = {
  sendNotification: (type, opts) => {
    // type(defined from receiver's perspective):
    // - request opts: {amount: float, recipient: address, from: address}
    // - received opts: {amount: float, recipient: address, from: address}

    return PushAPI.payloads.sendNotification({
      signer: channelSigner,
      type: 3, // target
      identityType: 2, // direct payload
      notification: {
        title: type === 'request'? 'Someone has asked you for some coin': 'Someone has sent you some coin',
        body: 'testing'
      },
      payload: {
        title: notificationIdentifier,
        cta: 'testing',
        img: 'testing',
        body: JSON.stringify(
                    {
                      type,
                      amount: _.get(opts, 'amount'),
                      channel: NOTIFICATION_CHANNEL,
                      from: _.get(opts, 'from'),
                      createdAt: Date.now(),
                      transactionId: _.get(opts, 'transactionId')
                    }
        )


      },
      recipients: `eip155:5:${_.get(opts, 'recipient')}`, // recipient address
      channel: `eip155:5:${NOTIFICATION_CHANNEL}`, // your channel address
      env: 'staging'
    });

  }
};
