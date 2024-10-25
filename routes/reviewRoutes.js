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

//from this point sequence it will protected
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo(baseRole.USER),
    reviewController.setTourAndUserId,
    reviewController.createReview
  );

router
  .route('/:id')
  .patch(
    authController.restrictTo(baseRole.USER, baseRole.ADMIN),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo(baseRole.USER, baseRole.ADMIN),
    reviewController.deleteReview
  )
  .get(reviewController.getReview);

module.exports = router;
