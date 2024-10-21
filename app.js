const express = require('express');
const morgan = require('morgan');

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
//this is global middleware stacks
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log('Middleware executed');
  next();
});

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//START SERVER
module.exports = app;
