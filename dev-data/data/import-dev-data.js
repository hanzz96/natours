const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TourModel = require('../../models/tourModel');

dotenv.config({
  path: './config.env'
});
console.log(process.env.MONGO_URI, 'test');
mongoose
  .connect(process.env.MONGO_URI, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: true,
  })
  .then(() => {
    // console.log(conn.connections, 'connected')
    console.log('DB Connection successfully');
  });

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
);

//import to MongoDB
const importData = async () => {
  try {
    await TourModel.create(tours);
    console.log('Data succesfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//delete all data from collections
const deleteData = async () => {
  try {
    await TourModel.deleteMany();
    console.log('Data succesfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
console.log(process.argv);
// importData();
