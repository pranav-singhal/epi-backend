module.exports = {
  getPublicKeyFromUser: async (user) => {
    const userDetails = await WalletUser.getUserByUserId(user);
    
    return _.get(userDetails, ['address'], '');
  }
};
