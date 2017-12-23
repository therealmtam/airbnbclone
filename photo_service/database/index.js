//README:
//This file contains database CRUD functions.
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
mongoose.connect('mongodb://localhost/photoservice');
//------------------------------------------
//CRUD FUNCTIONS:

const create = (file_loc, photo_id, photo_type) => {

  let model = new PhotoIndexModel;
  model.photo_id = photo_id;
  model.file_loc = file_loc;
  model.photo_type = photo_type;

  model.save((err, result) => {
		if (err) {
			//error handle later
    }
    console.log(result);
	});
};

const read = (id, callback) => {
  PhotoIndexModel.find({ photo_id: id }).exec().then(result => {
    callback(result);
  });
};

module.exports = {
  read: read,
  create: create
}


