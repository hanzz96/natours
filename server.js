process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({
  path: './config.env'
});
const app = require('./app');

// console.log(process.env.MONGO_URI, 'test');

//HANDLING REJECTIONS SUCH AS FAILED TO CONNECT TO DB

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

//get current application environment
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//the deployment should have tools that automatically to restartt the nodejs

//just change connection DB to empty string or etc you want to intended error
process.on('unhandledRejection', err => {
  console.log('UNHANDLER REJECTION! Shutting down...');
  console.log(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});

//this is example uncaughtException
// console.log(x);
