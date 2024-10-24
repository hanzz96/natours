const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Role = require('../utils/role');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name'],
      trim: true
      //not working for space
      // validate: [validator.isAlpha, 'A Tour Name must only contain characters']
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      required: [true, 'Please input the email'],
      validate: [validator.isEmail, 'Must email format'],
      lowercase: true
    },
    photo: {
      type: String
    },
    role: {
      type: String,
      enum: {
        values: Role.enumRole,
        message: 'Role must be either: admin, guide, leade-guide, user'
      },
      default: 'user'
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: 8,
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        //{VALUE} is static variable
        message: `Password Confirm must same with password`,
        validator: function(val) {
          //only work to NEW document creation
          return this.password === val;
        }
      }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpired: Date,
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  },
  //make virtual output after getting data to showing as a response
  //not working on query ex: tour.find({durationOfWeeks : 1}) <--not working
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.pre('save', async function(next) {
  // console.log(this);
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre('save', async function(next) {
  // console.log(this);
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = async function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(JWTTimestamp < changedTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  //encrypt it and return as hex, and save it,
  //don't save it as plain sha256, because it might get attacked
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpired = Date.now() + 10 * 60 * 1000;
  return resetToken;
};


//we can regex too
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});


const User = mongoose.model('User', userSchema);

module.exports = User;
