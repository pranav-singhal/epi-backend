const PushAPI = require('@pushprotocol/restapi');
const ethers = require('ethers');
const sailsHookGrunt = require('sails-hook-grunt');
const NOTIFICATION_CHANNEL = '0xBA36124E8af635d9d32C4cC49802cacade133a5F';
const NOTIFICATION_CHANNEL_PVT_KEY = '889fa6ff54d4190253a6b1c59bd08e3dc03485478dd93b2fff8e4600bde06b42';
const channelSigner = new ethers.Wallet(NOTIFICATION_CHANNEL_PVT_KEY);
const notificationIdentifier = 'wallet-notif';
const webPush = require('web-push');
const UserSubscription = require('../models/UserSubscription');

const vapidKeys = {
  publicKey:
    sails.config.vapid.publickey || procces.env.WALLET_API_VAPID_PUBLICKEY,
  privateKey: sails.config.vapid.privatekey || procces.env.WALLET_API_VAPID_PRIVATEKEY,
};

console.log("testing vapid 123 ====>", sails.config.vapid, procces.env.WALLET_API_VAPID_PRIVATEKEY, procces.env.WALLET_API_VAPID_PUBLICKEY);

webPush.setVapidDetails(
  'mailto:pranv@consolelabs.in',
  vapidKeys.publicKey,
  vapidKeys.privateKey,
);

module.exports = {
  sendNotification: async (type, opts) => {

    // type(defined from receiver's perspective):
    // - request opts: {amount: float, recipient: username, from: username}
    // - received opts: {amount: float, recipient: username, from: username}
    const recipient = _.get(opts, 'recipient');

    const userSubscription = await UserSubscription.getSubscriptionForUser(recipient);
    const notificationBody = JSON.stringify(
      {
        type,
        amount: _.get(opts, 'amount'),
        channel: NOTIFICATION_CHANNEL,
        from: _.get(opts, 'from'),
        createdAt: Date.now(),
        transactionId: _.get(opts, 'transactionId')
      }
    )

    // send web push notification if user is subscribed
    if (userSubscription) {
      const subscriptionObject = JSON.parse(_.get(userSubscription, 'subscription'));

      await webPush.sendNotification(
          subscriptionObject,
          notificationBody
      )
    }

    const recipientAddress = await WalletService.getPublicKeyFromUser(recipient)

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
        body: notificationBody
      },
      recipients: `eip155:5:${recipientAddress}`, // recipient address
      channel: `eip155:5:${NOTIFICATION_CHANNEL}`, // your channel address
      env: 'staging'
    });

  }
};
