//README:
//This file is a stand-alone file with limited dependencies.
//------------------------------------------
const redis = require('redis');
const fs = require('fs');
//------------------------------------------

const ClearCache = function () {

  let client = redis.createClient();

  client.once('ready', () => {
    client.flushall((err, result) => {
      console.log('Removed Redis Cache');

      fs.unlink(__dirname + `/seedCache.txt`, (err, result) => {
        //Throws an unhandled error if the txt file doesn't exist.
        client.quit();
      });
    });
  });

};
//------------------------------------------
ClearCache();
