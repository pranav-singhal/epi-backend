const PushAPI = require('@pushprotocol/restapi');
const ethers = require('ethers');
const NOTIFICATION_CHANNEL = '0xBA36124E8af635d9d32C4cC49802cacade133a5F';
const NOTIFICATION_CHANNEL_PVT_KEY = '889fa6ff54d4190253a6b1c59bd08e3dc03485478dd93b2fff8e4600bde06b42';
const channelSigner = new ethers.Wallet(NOTIFICATION_CHANNEL_PVT_KEY);
const notificationIdentifier = 'wallet-notif';
const webPush = require('web-push');
const admin = require('firebase-admin');
const atob = require("atob");

const configJson = {
  "type": "service_account",
  "project_id": "epi-wallet-v1",
  "private_key_id": _.get(sails, 'config.fcm.privatekeyid'),
  "private_key": atob(_.get(sails, 'config.fcm.privatekey')),
  "client_email": "firebase-adminsdk-wno2i@epi-wallet-v1.iam.gserviceaccount.com",
  "client_id": "111559224067296890306",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-wno2i%40epi-wallet-v1.iam.gserviceaccount.com"
}


const app = admin.initializeApp({
    credential: admin.credential.cert(configJson)
  });


const vapidKeys = {
  publicKey:
    sails.config.vapid.publickey,
  privateKey: sails.config.vapid.privatekey,
};

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

      if (_.get(subscriptionObject, 'type', 'web') === 'ios') {
        
        await NotificationService.sendFirebaseNotification({
          amount:_.get(opts, 'amount'),
          type,
          from: _.get(opts, 'from'),
          token: _.get(subscriptionObject, 'token')
        })

      } else {

        await webPush.sendNotification(
          subscriptionObject,
          notificationBody
      )
      }
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

  },
  sendFirebaseNotification: ({amount, type, from, token}) => {
    return app.messaging()
    .send({
    
      "name": "IOS Notification",
      "data": {
        "notificationDataKey": "notificationDataValue"
      },
      "notification": {
        "title": "EPI: Someone misses you ",
      "body": type === 'request' ? `${from} has requested ${amount} eth from you`: `${from} has sent you ${amount} eth`,
      "image": "stringhttps://picsum.photos/200/300"
      },
      "token": token
    
    })
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
      return true;
    })
    .catch((error) => {
      console.log('Error sending message:', error);
      return false
    })
  }
};
