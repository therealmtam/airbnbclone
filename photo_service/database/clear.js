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

const DeleteAll = function () {

  mongoose.connect('mongodb://localhost/photoservice', () => {
    PhotoIndexModel.remove({}).exec().then(result => {
      console.log('Removed PhotoIndexModel ', result.result);
    }).then(mongoose.connection.close());
  });

};
//------------------------------------------
DeleteAll();
