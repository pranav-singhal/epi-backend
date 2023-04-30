const DATABASE_ERROR_CODES = {
  notUnique: 'value already used',
  unknown: 'unknown error occured'
};

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
    const reqBody = _.get(req, 'body', {});
    const {
      username = "",
      address = "",
      avatarLink = "",
      user_type = ""
    } = reqBody;

    try {
      const newUserResponse = await WalletService.createNewUser({
        username, address, avatarLink, user_type
      });

      if (newUserResponse.error) {
        res.status(400);
        const errorCode = _.get(newUserResponse, 'message.footprint.identity', 'unknown');
        return res.json({error: {
          message: 'Unable to create user',
          detail: {
            keys: _.get(newUserResponse, 'message.footprint.keys', []),
            desc: DATABASE_ERROR_CODES[errorCode] || DATABASE_ERROR_CODES.unknown
          }
        }});
      }

      return res.json({user: newUserResponse});
    } catch (err) {
      res.status(400);
      return res.json({error: err.message});
    }

  }
};
