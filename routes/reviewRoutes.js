const express = require('express');
const reviewController = require('../controller/reviewController');
const authController = require('../controller/authController');
const { baseRole } = require('../utils/role');

const router = express.Router({
  mergeParams: true
});

//handled route
// /api/v1/tours/2fasd2.../reviews POST <-- this is from tourRoutes that mounting to reviewRoute
// /reviews POST

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo(baseRole.USER),
    reviewController.setTourAndUserId,
    reviewController.createReview
  );

router
  .route('/:id')
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview)
  .get(reviewController.getReview);

module.exports = router;
