module.exports = {
  getAllUsers: async () => {
    const query = `SELECT * FROM wallet_user`;

    const dbResponse = await sails
      .getDatastore()
      .sendNativeQuery(query);

    return dbResponse.rows;

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
