const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true
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
      required: [true, 'A tour must have a difficulty']
    },
    ratingsAverage: {
      type: Number,
      default: 4.5
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Must have a price']
    },
    priceDiscount: Number,
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
    }
  },
  //make virtual output after getting data to showing as a response
  //not working on query ex: tour.find({durationOfWeeks : 1}) <--not working
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.virtual('durationWeeks').get(function() {
  //we need "this" keyword, so arrow function not used
  return this.duration / 7;
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

// tourSchema.pre('save', function(next) {
//   console.log(this, ' Will save document...');
//   next();
// });

//after execute save
// tourSchema.post('save', function(doc, next) {
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
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline(), 'aggregate');

  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
