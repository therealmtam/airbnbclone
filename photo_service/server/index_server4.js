// //------------------------------------------
// // Add this to the VERY top of the first file loaded in your app
// const apm = require('elastic-apm').start({
//   // Set required app name (allowed characters: a-z, A-Z, 0-9, -, _, and space)
//   appName: 'photo_service'
// });
// //------------------------------------------

//README:
//This file contains all server functions.
//------------------------------------------
const express = require('express');
const db = require('../database');
const cache = require('../cache');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
//------------------------------------------
const app = express();
//------------------------------------------
//app.use(express.static(__dirname + '/../testClient'));
//------------------------------------------
app.get('/', (request, response) => {
  console.log('Server4');
  response.status(200).send('Hello4');
});
//------------------------------------------
app.post('/uploadphoto', (request, response) => {
  const photo_id = Date.now();

  const storage = multer.diskStorage({
    destination: __dirname + '/../photos/',
    filename: function (request, file, cb) {
      cb(null, photo_id + path.extname(file.originalname));
    }
  });

  //Store the uploaded photo file onto the Photos folder on the Server =>
  //Respond to the Post =>
  (multer({
    storage: storage,
  }).single('photo'))(request, response, (err) => {
    if (err) {
      response.send(err);
    }

    const generateRandPhotoType = () => {
      const types = ['int', 'ext'];
      function getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      return types[getRandomIntInclusive(0, 1)];
    };

    const photo_type = generateRandPhotoType();

    const file_loc = `${__dirname}/../photos/${photo_id}.jpg`;

    db.create(file_loc, photo_id, photo_type);  //don't wait for this async op
    //write to the cache as well;

    const newPhotoInfo = {
      url: `http://localhost:3000/photo/${photo_id}`,
      photoType: photo_type
    };

    response.send(JSON.stringify(newPhotoInfo));
  });

});
//------------------------------------------
app.get('/photo/:id', (request, response) => {

  cache.read(request.params.id, (result) => {
    if (!result) {
      db.read(request.params.id, (result) => {
        if (!result) {
          response.status(200).send('no photo');
        } else {
          cache.create(result[0].photo_id, result[0].file_loc);
          fs.readFile(result[0].file_loc, (err, binary_data) => {
            if (err) {
              console.log(err);
            }
            response.status(200).send(binary_data);
          });
        }
      });
    } else {
      fs.readFile(result, (err, binary_data) => {
        if (err) {
          console.log(err);
        }
        response.status(200).send(binary_data);
      });
    }
  });

});
//------------------------------------------
let counter1 = 0;
app.get('/test', (request, response) => {
  counter1++;
  console.log('TEST4 ', counter1);
  response.send('');
});
//------------------------------------------
//SETUP CONNECTION TO SERVER:
const port = 6000;
const ip = '127.0.0.1';

app.listen(port, () => {
  console.log(`Connected to http://${ip}:${port}`);
});

//HOW TO DO A POST LOAD TEST ON AB:
//POST: ab -c 1 -n 10 -p name.json -T application/json http://sdadasd
