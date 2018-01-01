//README:
//This file contains database CRUD functions.
//------------------------------------------
const redis = require('redis');
//------------------------------------------
const client = redis.createClient();  //Note: Async process
//------------------------------------------
//CRUD FUNCTIONS:

const create = (id, val, callback) => {
  client.set(id, val, (err, result) => {
    if (err) {
      console.log(err);
    }
    console.log('created new cache entry');
    if (callback) {
      callback(result);
    }
  });
};

const read = (id, callback) => {
  client.get(id, (err, result) => {
    if(err) {
      console.log(err);
    }
    callback(result);
  });
};

module.exports = {
  create: create,
  read: read,
}


