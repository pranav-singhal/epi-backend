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
  'POST /message': 'MessageController.create', // done
  'PUT /transaction/:id': 'TransactionController.update', // done
  'GET /messages': 'MessageController.getMessagesWithFilters', // done
  'GET /threads': 'MessageController.getThreadsForSender', // done
  'GET /transaction/qrcode/:id': 'TransactionController.getByQRCodeId', // done
  'GET /users': 'UserController.getAll', // done
  'POST /user': 'UserController.create', // done
  'POST /user/subscription': 'UserSubscriptionController.create', // done
  'GET /user/:username/subscription': 'UserSubscriptionController.get', // done
  'POST /temp': 'MessageController.tempFunction', // done
  'GET /users/:username': 'UserController.getUserByUsername', // done,
  'POST /payout/vpa/validate': 'PayoutController.validateVpa',
  'POST /payout/transaction/generate': 'PayoutController.generateSignatureForTransaction',
  'POST /payout/transaction/process': 'PayoutController.processTransactionEvents'


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
