module.exports = {
  getPublicKeyFromUser: async (user) => {
    const userDetails = await WalletUser.getAllUsersByUsername();
    return _.get(userDetails, [user, 'address'], '');
  }
};
