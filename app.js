const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//========================= setting secure http headers
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour'
});

//only affect to prefix url '/api' rate limiter request
// ========================= prevent denial of service or brute force
app.use('/api', limiter);

//body parser, reading data from the body into req.body
app.use(
  express.json({
    //we can limit by data size
    limit: '10kb'
  })
);

//data sanitization, prevent attacker against sql injection
app.use(mongoSanitize());

//datasanitization prevent against XSS, maybe payload like {"name" : "<div id='bad code'> </div>"}
app.use(xss());

//prevent parameter pollution, ex:  sort=name&sort=price <-- it will return as array
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

//for exposing html things also, serving static files
app.use(express.static(`${__dirname}/public`));

//express middleware
//remember, this is sequential, if you put this into bottom of  code, the middleware not executed
//THIS IS global middleware stacks
app.use((req, res, next) => {
  // req.requestTime = new Date().toISOString();
  console.log('Middleware executed');
  // console.log(req.headers);
  next();
});

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
