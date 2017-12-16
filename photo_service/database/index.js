//README:
//This file contains database CRUD functions.
//------------------------------------------
const mongoose = require('mongoose');
//------------------------------------------
const Schema = mongoose.Schema;
const binaryDataSchema = new Schema({
  photo_id: Number,
  binary_data: Buffer,
  photo_type: String,
});
//------------------------------------------
let BinaryDataModel = mongoose.model('binarydata', binaryDataSchema);
//------------------------------------------
mongoose.connect('mongodb://localhost/photoservice');
//------------------------------------------
//CRUD FUNCTIONS:

const create = (binary_data, photo_id, photo_type) => {

  let model = new BinaryDataModel;
  model.binary_data = binary_data;
  model.photo_id = photo_id;
  model.photo_type = photo_type;

  model.save((err, result) => {
		if (err) {
			//error handle later
    }
    console.log(result);
	});
};

const read = (id, callback) => {
  BinaryDataModel.find({ photo_id: id }).exec().then(result => {
    callback(result);
  });
};

module.exports = {
  read: read,
  create: create
}


