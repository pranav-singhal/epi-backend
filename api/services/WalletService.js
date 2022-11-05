const userDetails = {
  pranav: {
    name: 'pranav',
    //   114addfd125a71f033c64f1eeb3b59ca468481233087aaca1b94ad09e54d71d4
    address: '0xD7F1a592874bbe5d14c3f024c08b630e6De5A11B',
    avatarLink: 'https://picsum.photos/id/1025/200/300.jpg'
  },
  arvind: {
    name: 'arvind',
    //   2c50af1aca14de451dc7876362aee7a9d4ee513fe754d9562d2e87cbe9ff1307
    address: '0xD4ea698DfCdf0ADDeAAe77A2d6584f822738cf66',
    avatarLink: 'https://picsum.photos/id/237/200/300.jpg'
  },
  vendor: {
    name: 'vendor',
    address: '0xD4ea698DfCdf0ADDeAAe77A2d6584f822738cf67',
    avatarLink: 'https://picsum.photos/id/238/200/300.jpg'
  }
};

module.exports = {
  getPublicKeyFromUser: (user) => {
    return _.get(userDetails, [user, 'address'], '');
  }
};
