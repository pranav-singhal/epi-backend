const { Wallet } = require("ethers");
const UserSubscription = require("../models/UserSubscription");
const WalletUser = require("../models/WalletUser");

/**
 * UserSubscriptionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    create: async (req, res) => {
        const {
            username,
            subscription
        } = req.body;

        const userDetails = await WalletUser.getUserByUsername(username)

        const userSubscription = await UserSubscription.getSubscriptionForUser(username);

        if (userSubscription) {

            if(userSubscription.subscription  !== subscription) {
                // update the subscription object
                const updatedUserSubscription = await UserSubscription.updateUserSubscription(username, subscription);
                return res.json({userDetails, updatedUserSubscription})
            }

            res.status(400)
            return res.json({error: {
                message: "user subscription already exists",
                userSubscription
            }})
        }

        const newUserSubscription = await UserSubscription.createNewSubscriptionForUser(username, subscription);

        return res.json({userDetails, newUserSubscription})
    },

    get: async (req, res) => {
        const username = req.param('username');
        const userSubscription = await UserSubscription.getSubscriptionForUser(username);

        return res.json({userSubscription})
    }
}
