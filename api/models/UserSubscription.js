/**
 * UserSubscription.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    username: {type: 'string'},
    subscription: {type: 'string'}
    },

    createNewSubscriptionForUser: async (user, subscription) => {
        const query = `INSERT INTO user_subscription ("username", "subscription") VALUES ($1, $2) RETURNING *`;

        const dbResponse = await sails
        .getDatastore()
        .sendNativeQuery(query, [user, subscription])

        return dbResponse.rows[0];
    },

    getSubscriptionForUser: async (user) => {
        const query = `SELECT * from user_subscription where username = $1`;
        const dbResponse = await sails
        .getDatastore()
        .sendNativeQuery(query, [user])

        return dbResponse.rows[0];
    },
    updateUserSubscription: async (user, subscription) => {
        
        // UPDATE COMPANY SET SALARY = 15000 WHERE ID = 3;
        const query = `UPDATE user_subscription SET subscription = $1 where username = $2 RETURNING *`;

        const dbResponse = await sails
        .getDatastore()
        .sendNativeQuery(query, [subscription, user]);

        return dbResponse.rows[0]
    }
}