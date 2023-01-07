const PushAPI = require('@pushprotocol/restapi');
const ethers = require('ethers');
const NOTIFICATION_CHANNEL = '0xBA36124E8af635d9d32C4cC49802cacade133a5F';
const NOTIFICATION_CHANNEL_PVT_KEY = '889fa6ff54d4190253a6b1c59bd08e3dc03485478dd93b2fff8e4600bde06b42';
const channelSigner = new ethers.Wallet(NOTIFICATION_CHANNEL_PVT_KEY);
const notificationIdentifier = 'wallet-notif';
const webPush = require('web-push');
const admin = require('firebase-admin');

const UserSubscription = require('../models/UserSubscription');


console.log("password*********************")


console.log(_.get(sails, 'config.datastores.default.password'))
console.log("password*********************")
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

  },
  sendFirebaseNotification: () => {
    app.messaging()
    .send({
    
      "name": "testing",
      "data": {
        "notificationDataKey": "notificationDataValue"
      },
      "notification": {
        "title": "from epi wallet",
      "body": "someone keeps sending u you some coin",
      "image": "stringhttps://picsum.photos/200/300"
      },
      "token": "czQ5fPxU1UHDsrtXQ9yp2k:APA91bGWZmcAHt-TMNDKk-IeDPYtuW5z8FruC1tszwEHXmWzkB-AisRs-P0jv0r7hJUZFBZCb1Pv9x8lmjxiC-1JxqnBNBzuif2JezRmBUQk3i1za4Qh4W46Q1q7TCmeu5wfZHQxzbeE"
    
    })
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    })
  }
};
