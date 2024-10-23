const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());

//for exposing html things also
app.use(express.static(`${__dirname}/public`));
//express middleware
//remember, this is sequential, if you put this into bottom of  code, the middleware not executed

//THIS IS global middleware stacks
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   console.log('Middleware executed');
//   next();
// });

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//this is the last part, so any route that not triggered in above tours or users, will be executed in here,
//REMEMBER THIS IS SEQUENTIAL, IF WE PUT THIS ABOVE IN TOP SEQUENCE, IT WILL ALWAYS EXECUTED
app.all('*', (req, res, next) => {
  //will trigger error in express automatically
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

//START SERVER
module.exports = app;
