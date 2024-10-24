const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Role = require('../utils/role');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_COOKIE * 24 * 60 * 60 * 1000
    ),
    //prevent cross site script attack
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);
  //remove password from reponse
  user.password = undefined;
  res.status(statusCode).json({
    status: 'Success',
    token: token,
    data: {
      user: user
    }
  });
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const query = User.find();

  //real execution DB in here, its same like laravel ->get()
  //this is where before query executed, the query middleware will execute first. see tourModel.js
  const users = await query;
  res.status(200).json({
    status: 'Success',
    results: users.length,
    data: {
      users: users
    }
  });
});

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new AppError(`Email or Password should be provided`));
  }

  //   const encryptedPass = await bcrypt.hash(this.password, 12);

  const user = await User.findOne({
    email: email
  }).select('+password');

  if (!user) {
    next(new AppError(`User not exists`, 401));
  }

  const correct = await user.correctPassword(password, user.password);
  if (!correct) {
    next(new AppError(`Password not match`, 401));
  }
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordChangedAt = new Date();
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //   console.log(req.headers, 'a');
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // console.log(token, 'token');
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }

  //make a promise
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //   console.log(decoded, 'decoded');

  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(`The token belonging to this user does no longer exist`, 401)
    );
  }

  if (await freshUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(`User recently changed password, please login again`, 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;

  next();
});

exports.restrictTo = (...roles) => {
  return async (req, res, next) => {
    console.log(req.user, 'roles');

    if (!roles.includes(req.user.role || Role.baseRole.USER)) {
      return next(
        new AppError(`You dont have permission to perform this action`, 403)
      );
    }
    next();
  };
};

exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetToken: { $gt: Date.now() }
  });

  //if token not expired and equals to encrypted token
  if (!user) {
    return next(new AppError(`Token is invalid or expired`, 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpired = undefined;

  //update the password
  await user.save();

  //log user in, and create new JWT

  createSendToken(user, 201, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email', 404));
  }

  const resetToken = user.createPasswordResetToken();

  //bypass a validator
  await user.save({
    validateBeforeSave: false
  });

  //generate random reset token
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and password confirm to ${resetUrl} this url only valid for 10 minutes!. \n if you didn't forget your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Your Password reset token`,
      message
    });

    res.status(200).json({
      status: 'Success',
      message: 'Token send to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    await user.save({
      validateBeforeSave: false
    });

    return next(
      AppError('There was an error sending the email, try again later', 500)
    );
  }
});
