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
//Change this value. Defined when instance is created on AWS
const AWSinstanceNum = 1;
//------------------------------------------
const app = express();
//------------------------------------------
//app.use(express.static(__dirname + '/../testClient'));
//------------------------------------------
app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname + '/../testClient/index.html'));
});
//------------------------------------------

let newUrl = [];
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
    cache.create(photo_id, file_loc); //don't wait for this async op

    const newPhotoInfo = {
      url: `http://${ip}:${port}/photo/${photo_id}`,
      photoType: photo_type
    };

    // Add new url to queue
    newUrl.push(newPhotoInfo.url);

    // Set a timer to delete newly uploaded photos from the file system:
    setTimeout(() => {
      if (fs.existsSync(file_loc)) {
        fs.unlinkSync(file_loc);
      }
      cache.destroy(photo_id, () => { db.destroy(photo_id, () => { console.log('removed from db') }) });
      newUrl.shift();
    }, 20000);

    response.redirect('/');
  });

});
//------------------------------------------

let sendErrorMsg = '';
let noFileUploadError = '';

app.get('/photo/:id', (request, response) => {

  cache.read(request.params.id, (result) => {
    if (!result) {
      db.read(request.params.id, (result) => {
        if (!result) {
          sendErrorMsg = request.params.id;
          response.redirect('/');
        } else {
          cache.create(result[0].photo_id, result[0].file_loc);

          if (fs.existsSync(result[0].file_loc)) {
            fs.readFile(result[0].file_loc, (err, binary_data) => {
              if (err) {
                console.log(err);
              }
              response.status(200).send(binary_data);
            });
          } else {
            noFileUploadError = request.params.id;
            response.redirect('/');
          }
        }
      });
    } else {
      if (fs.existsSync(result)) {
        fs.readFile(result, (err, binary_data) => {
          if (err) {
            console.log(err);
          }
          response.status(200).send(binary_data);
        });
      } else {
        noFileUploadError = request.params.id;
        response.redirect('/');
      }
    }
  });

});
//------------------------------------------
let counter1 = 0;
app.get('/test', (request, response) => {
  counter1++;
  console.log(`TEST INSTANCE${AWSinstanceNum} `, counter1);
  response.send('');
});
//------------------------------------------
const loaderCode = 'loaderio-90092a896689384c7186faed5b1df947';
app.get(`/${loaderCode}`, (request, response) => {
  console.log('LOADER ', loaderCode);
  response.status(200).send(loaderCode);
});
//------------------------------------------
app.get('/newurl', (request, response) => {
  const error1 = sendErrorMsg;
  sendErrorMsg = '';
  const error2 = noFileUploadError;
  noFileUploadError = '';
  response.send(JSON.stringify({ newUrl: newUrl, error1: error1, error2: error2 }));
});
//------------------------------------------
//SETUP CONNECTION TO SERVER:
const port = 80;
const ip = 'ec2-54-241-149-218.us-west-1.compute.amazonaws.com';
// const port = 3000;
// const ip = 'localhost';

app.listen(port, () => {
  console.log(`Connected to http://${ip}:${port}`);
});

//HOW TO DO A POST LOAD TEST ON AB:
//POST: ab -c 1 -n 10 -p name.json -T application/json http://sdadasd
