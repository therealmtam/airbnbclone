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

const multer = require('multer');
const path = require('path');
const fs = require('fs');
//------------------------------------------
const app = express();
//------------------------------------------
app.use(express.static(__dirname + '/../testClient'));
//------------------------------------------
app.post('/uploadphoto', (request, response) => {
  const photo_id = Date.now();

  const storage = multer.diskStorage({
    destination: __dirname + '/../database/tmp/',
    filename: function (request, file, cb) {
      cb(null, photo_id + path.extname(file.originalname));
    }
  });

  //Store the uploaded photo file onto the Server =>
  //Read the binary data from the file & Respond to the Post =>
  //Save the binary data to the database & Remove the file from the Server
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

    const binary_data = fs.readFile(__dirname + `/../database/tmp/${photo_id}.jpg`, (err, data) => {
      //error handle later
      db.create(data, photo_id, photo_type);
      fs.unlink(__dirname + `/../database/tmp/${photo_id}.jpg`, (err) => {
        //error handle later
      });
    });

    const newPhotoInfo = {
      url: `http://localhost:3000/photo/${photo_id}`,
      photoType: photo_type
    };

    response.send(JSON.stringify(newPhotoInfo));
  });

});
//------------------------------------------
app.get('/photo/:id', (request, response) => {

  db.read(request.params.id, (result) => {
    if (!result) {
      response.status(200).send('no photo');
    } else {
      // console.log(result[0].binary_data);
      response.status(200).send(result[0].binary_data);
    }
  });

});
//------------------------------------------
let counterTest = 0;
app.get('/test', (request, response) => {
  console.log('RUN ', counterTest++);
  response.send('');
});
//------------------------------------------
//SETUP CONNECTION TO SERVER:
const port = 3000;
const ip = '127.0.0.1';

app.listen(port, () => {
  console.log(`Connected to http://${ip}:${port}`);
});

//HOW TO DO A POST LOAD TEST ON AB:
//POST: ab -c 1 -n 10 -p name.json -T application/json http://sdadasd