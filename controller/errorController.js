const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value : ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(field => field.message);

  const message = `Invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = err =>
  new AppError('Invalid token, please login again!', 401);

const handleJWTExpiredError = err =>
  new AppError('Your token is expired, Please login again', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted and handled by programmer
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  //this is unexpected error that unhandled by programmer such as third party, unknown error, we dont want to leak to client in prod
  else {
    //1) Log the unknown error, there is npm for logging, this is just example
    console.error('ERROR : ', err, 'jsonSTRINGIFY', JSON.stringify(err));
    //2) Send generic/static message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

//express automatically detect if 4 args then this is global handler error
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Error!';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let errorOverride = Object.assign(err);
    // console.log(errorOverride, 'clone err');
    if (errorOverride.name === 'CastError') {
      // console.log('masuk');
      errorOverride = handleCastErrorDB(errorOverride);
    }
    if (errorOverride.code === 11000) {
      errorOverride = handleDuplicateFieldsDB(errorOverride);
    }
    if (errorOverride.name === 'ValidationError') {
      errorOverride = handleValidationErrorDB(errorOverride);
    }
    if (errorOverride.name === 'JsonWebTokenError') {
      errorOverride = handleJWTError(errorOverride);
    }
    if (errorOverride.name === 'TokenExpiredError') {
      errorOverride = handleJWTExpiredError(errorOverride);
    }
    sendErrorProd(errorOverride, res);
  }
};
