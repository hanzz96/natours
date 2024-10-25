const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  // Tour.findOne({_id : req.params.id})
  let filter = {};
  if (req.params.tourId) {
    filter = { tour: req.params.tourId };
  }
  const reviewData = await Review.find(filter);

  res.status(200).json({
    status: 'Success',
    results: reviewData.length,
    data: { reviewData }
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  //Allow nested route
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  // Tour.findOne({_id : req.params.id})
  const newReview = await Review.create(req.body);

  res.status(200).json({
    status: 'Success',
    data: { review: newReview }
  });
});
