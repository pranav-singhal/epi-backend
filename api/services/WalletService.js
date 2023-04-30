const alloweduserTypes = {
  USER: 'user',
  ANON: 'anonymous_user'
};

module.exports = {
  getPublicKeyFromUser: async (user) => {
    const userDetails = await WalletUser.getUserByUserId(user);

    return _.get(userDetails, ['address'], '');
  },

  createNewUser: ({username, address, avatarLink, user_type}) => {
    if(
      _.isEmpty(username) ||
      _.isEmpty(address)

    ) {
      throw new Error('Address or username cannot be empty');
    }

    if(
      !_.includes(_.values(alloweduserTypes), user_type)
    ) {
      throw new Error(`user_type can only be one of ${_.values(alloweduserTypes).join(',')}`);    }

    return WalletUser.createNewUser({username, address, avatarLink, user_type});
  }
};
