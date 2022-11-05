module.exports = {
  getAll: async (req, res) => {
    const usersArray = await WalletUser.getAllUsers();

    let usersByUsername = {};
    _.forEach(usersArray, _user => {
      usersByUsername[_user.username] = {
        name: _user.username,
        ..._user
      };
    });

    return res.json({users: usersByUsername});
  },

  create: async (req, res) => {

    const newUserResponse = await WalletUser.createNewUser({
      ...req.body
    });

    if (newUserResponse.error) {
      res.status(400);
      return res.json({error: newUserResponse});
    }

    return res.json({user: newUserResponse});
  }
};
