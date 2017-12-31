//README:
//This file is a stand-alone file with limited dependencies.
//------------------------------------------
const mongoose = require('mongoose');
//------------------------------------------
const Schema = mongoose.Schema;
const photoIndexSchema = new Schema({
  photo_id: { type: Number, index: true },
  file_loc: String,
  photo_type: String,
});
//------------------------------------------
let PhotoIndexModel = mongoose.model('photo', photoIndexSchema);
//------------------------------------------
const redis = require('redis');
const fs = require('fs');
//------------------------------------------

let counter = 0;
const records = 100000;

let counter2 = 1; //TEMPORARILY USED TO DO LOAD TESTING

function createModels () {

  let models = [];

  for (let i = 1; i <= 10; i++) {
    let model = new PhotoIndexModel;
    model.photo_id = counter2; //eventually use Date.now() in real service usage
    model.file_loc = `${__dirname}/../photos/ext${i}.jpg`;
    model.photo_type = 'ext';
    models.push(model);
    counter2++;
  }

  for (let i = 1; i <= 10; i++) {
    let model = new PhotoIndexModel;
    model.photo_id = counter2; //eventually use Date.now() in real service usage
    model.file_loc = `${__dirname}/../photos/int${i}.jpg`;
    model.photo_type = 'int';
    models.push(model);
    counter2++;
  }

  return models;
};
//------------------------------------------

function endSeed (err) {
  if (err) {
    console.log(err);
  } else {
    if (counter < records) {
      bulkInsert();
    } else {
      console.log('Counter ', counter);
      console.log('Time :', (Date.now() - beginTime) / 1000, 'seconds');
      mongoose.connection.close();

      seedCache();
    }
  }
};
//------------------------------------------

let start = false;
let beginTime;

function bulkInsert() {

  if (!start) {
    beginTime = Date.now();
    start = true;
  }

  let models = createModels();
  let bulk = PhotoIndexModel.collection.initializeUnorderedBulkOp();
  let cacheText = '';

  for (var i = 0; i < models.length; i++) {
    bulk.insert(models[i]);
    counter++;
    console.log('inserting #: ', counter);
    cacheText = cacheText + `["SET", "${models[i].photo_id}", "${models[i].file_loc}"],`;
  }

  fs.appendFile(__dirname + `/../cache/seedCache.txt`, cacheText, (err) => {
    if (err) {
      console.log(err);
    }
  });

  bulk.execute(endSeed);
};
//------------------------------------------

function seedCache () {
  let client = redis.createClient();

  client.on('connect', () => {
    console.log('CONNECTED TO REDIS FOR SEEDING CACHE ');

    let cmds = fs.readFileSync(__dirname + `/../cache/seedCache.txt`, 'utf8');
    let batchCmds = JSON.parse(`[${cmds.slice(0, cmds.length-1)}]`);

    client.batch(batchCmds).exec((err, result) => {
      if (err) {
        console.log(err);
      }
      client.quit((err, result) => {
        console.log('QUIT REDIS ');
      });
    });

  });

};

//------------------------------------------

const Seed = function () {
  mongoose.connect('mongodb://localhost/photoservice', bulkInsert);
};
//------------------------------------------
Seed(); //Begins the Seeding Process

//------------------------------------------
//For Mongoose Connect:
//Ensure that the callback function is declared or
//hoisted before connection is called.
//Connection is an async process.