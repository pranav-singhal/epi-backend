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

  getUserByUsername: async (req, res) => {

    const username = req.param('username');
    try {
      const userDetails = await WalletUser.getUserByUsername(username);

      if (_.isEmpty(userDetails)) {
        res.status(404);
        return res.json({message: 'user not found'});
      }

      return res.json({[username]: userDetails});
    } catch (e) {
      res.status(400);
      return  res.json({error: e});
    }
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
