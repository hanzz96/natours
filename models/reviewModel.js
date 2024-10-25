const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Please input the review'],
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: { type: Date, default: Date.now() },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  //make virtual output after getting data to showing as a response
  //not working on query ex: tour.find({durationOfWeeks : 1}) <--not working
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index(
  {
    //sorting price in ascending, -1 is descending
    tour: 1,
    user: 1
  },
  { unique: true }
);

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // })
  // .populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.statics.calcAverageRating = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

//pointing to static method and eeven after saving data
reviewSchema.post('save', function() {
  /**
   * the alternative way instead of Review.calcAverageRating, because its sequencetial, you can't move this pre/post save to below const Review because its not registered.
   * the solution is we trigger consutrctor to get the class
   */
  this.constructor.calcAverageRating(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function(doc) {
  console.log(doc, 'docs');
  await doc.constructor.calcAverageRating(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
