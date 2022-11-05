module.exports = {
  getAllUsers: async () => {
    const query = `SELECT * FROM wallet_user`;

    const dbResponse = await sails
      .getDatastore()
      .sendNativeQuery(query);

    return dbResponse.rows;

  },

  getAllUsersByUsername: async () => {
    const usersArray = await WalletUser.getAllUsers();

    let usersByUsername = {};
    _.forEach(usersArray, _user => {
      usersByUsername[_user.username] = {
        name: _user.username,
        ..._user
      };
    });

    return usersByUsername;
  },

  createNewUser: async ({username, avatarLink, address, user_type}) => {
    const query = `INSERT into wallet_user (username, avatar, address, user_type) VALUES ($1, $2, $3, $4) RETURNING *`;

    try {
      const dbResponse = await sails
        .getDatastore()
        .sendNativeQuery(query, [username, avatarLink, address, user_type]);

      return dbResponse.rows[0];
    } catch (e) {
      return {error: true, message: e};
    }
  }
};
