/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': { view: 'pages/homepage' },
  'GET /messages': 'MessageController.getMessagesWithFilters',
  'GET /threads': 'MessageController.getThreadsForSender',
  'GET /transaction/qrcode/:id': 'TransactionController.getByQRCodeId',
  'GET /users': 'UserController.getAll',
  'GET /user/:username/subscription': 'UserSubscriptionController.get',
  'GET /users/:username': 'UserController.getUserByUsername',
  'GET /payout/contracts': 'PayoutController.getAllPayoutContracts',
  'GET /payout/vpa/transactions': 'PayoutController.getTransactionsForUser',

  'POST /message': 'MessageController.create',
  'PUT /transaction/:id': 'TransactionController.update',
  'POST /user': 'UserController.create',
  'POST /user/subscription': 'UserSubscriptionController.create',
  'POST /payout/vpa/validate': 'PayoutController.validateVpa',
  'POST /payout/transaction/generate': 'PayoutController.generateSignatureForTransaction',
  'POST /payout/transaction/process': 'PayoutController.processTransactionEvents',
  'POST /user/claim': 'UserController.claim',

  'POST /temp': 'MessageController.tempFunction'


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/


};
