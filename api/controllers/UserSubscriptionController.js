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
        const userId = userDetails?.id;

        const userSubscription = await UserSubscription.getSubscriptionForUser(userId);

        if (userSubscription) {

            if(userSubscription.subscription  !== subscription) {
                // update the subscription object
                const updatedUserSubscription = await UserSubscription.updateUserSubscription(userId, subscription);
                return res.json({userDetails, updatedUserSubscription})
            }

            res.status(400)
            return res.json({error: {
                message: "user subscription already exists",
                userSubscription
            }})
        }

        const newUserSubscription = await UserSubscription.createNewSubscriptionForUser(userId, subscription);

        return res.json({userDetails, newUserSubscription})
    },

    get: async (req, res) => {
        const username = req.param('username');
        const userDetails = await WalletUser.getUserByUsername(username)
        const userId = userDetails?.id;
        if (!userId) {
            res.status(400);
            res.json({message: "user not found"})
        }
        
        const userSubscription = await UserSubscription.getSubscriptionForUser(userId);
        return res.json({userSubscription})
    },

    delete: async (req, res) => {
        const username = req.param('username');

        const userDetails = await WalletUser.getUserByUsername(username)
        const userId = userDetails?.id;
        if (!userId) {
            res.status(400);
            res.json({message: "user not found"})
        }

        await UserSubscription.deleteUserSubscription(userId);

        return res.json({status: true})
    }
}
