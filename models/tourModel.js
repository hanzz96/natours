const mongoose = require('mongoose');

const slugify = require('slugify');

const validator = require('validator');
const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      //only available to type String
      maxLength: [50, 'A Tour Name must maximum 50 characters'],
      minLength: [5, 'A Tour Name must minimum 5 characters']
      //not working for space
      // validate: [validator.isAlpha, 'A Tour Name must only contain characters']
    },
    slug: {
      type: String
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either : easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      //this work with Dates, and Number
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must ba below 5.0'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        //{VALUE} is static variable
        message: `Discount price ({VALUE}) should be below regular price`,
        validator: function(val) {
          //only work to NEW document creation
          return this.price > val;
        }
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summery']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GEO JSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    //doing embedding
    // guides: Array
    //doint reference
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
  },
  //make virtual output after getting data to showing as a response
  //not working on query ex: tour.find({durationOfWeeks : 1}) <--not working
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//this is indexing
// tourSchema.index({
//   //sorting price in ascending, -1 is descending
//   price: 1
// })
//compound index
tourSchema.index({
  //sorting price in ascending, -1 is descending
  price: 1,
  ratingsAverage: -1
});

tourSchema.index({
  slug: 1
});

tourSchema.index({
  startLocation: '2dsphere'
});

tourSchema.virtual('durationWeeks').get(function() {
  //we need "this" keyword, so arrow function not used
  return this.duration / 7;
});

//Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//DOCUMENT MIDDLEWARE
//mongoose middleware, there are 4 kind middleware
//document, query, aggregate, document middleware
// run before .save() and .create() , NOT WORKING ON .insertMany()
tourSchema.pre('save', function(next) {
  // console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

//EMBEDDING EXAMPLE WITH GUIDES
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => {
//     return await User.findById(id);
//   });
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function(next) {
//   console.log(this, ' Will save document...');
//   next();
// });

//after execute save
// tourSchema.post('save', function() {
//   next();
// });

//QUERY MIDDLEWARE
//usecase determine every record to show is only secret, or VIP, so the public data should not show the VIP/secret stuff.
// tourSchema.pre('find', function(next) {
//   this.find({ secretTour: { $ne: true } });
//   next();
// });

//we can regex too
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

//after execute find
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} ms`);
  next();
});

//alternative to add pre execute findOne methods
// tourSchema.pre('findOne', function(next) {
//   this.find({ secretTour: { $ne: true } });
//   next();
// });

//AGGREGATION MIDDLEWARE
//use case now is , EXCLUDE A SECRET TOUR FROM STATS or any kind API that use aggregate function API mongoose

tourSchema.pre('aggregate', function(next) {
  //this point on current aggregation
  if (!(this.pipeline().length > 0 && '$geoNear' in this.pipeline()[0])) {
    this.pipeline().unshift({
      $match: { secretTour: { $ne: true } }
    });
  }
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
