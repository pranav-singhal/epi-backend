/**
 * VpaTransaction.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

 module.exports = {
//   CREATE TABLE vpa_transactions(
//     ID INT PRIMARY KEY NOT null,
//     tx_hash text not null,
//     crypto_amount numeric not null,
//     crypto_name text not null,
//     fiat_amount numeric not null,
//     fiat_name text not null,
//     status text not null,
//     meta json
//  );

  addTransaction: async ({txHash, crypto_amount, crypto_name, fiat_amount, fiat_name, status, meta}) => {
    const query = `INSERT INTO vpa_transactions ("tx_hash", "crypto_amount", "crypto_name", "fiat_amount", "fiat_name", "status", "meta") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const dbResponse = await sails
      .getDatastore()
      .sendNativeQuery(query, [txHash, crypto_amount, crypto_name, fiat_amount, fiat_name, status, meta]);

    return dbResponse.rows[0];
  },

  addEthToInrPendingTransaction: (txHash, crypto_amount, fiat_amount) => {
    return VpaTransaction.addTransaction({
      txHash,
      crypto_amount,
      crypto_name: 'ETH',
      fiat_amount,
      fiat_name: 'INR',
      status: 'pending',
      meta: {message: "Please wait while we process your payment"}
    })
  },

  updateTransactionStatus: async (txId, _status, meta) => {
    const query = `UPDATE vpa_transactions set status = $2, meta =$3 where id = $1`;

    const dbResponse = await sails
    .getDatastore()
    .sendNativeQuery(query, [txId, _status, meta])

    return dbResponse.rows[0];
  },

  updateTransactionStatusToDeclined: (txId, meta) => VpaTransaction.updateTransactionStatus(txId, 'declined', meta)
  
  
  };
  
  