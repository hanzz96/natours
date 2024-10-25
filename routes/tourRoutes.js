const express = require('express');
const tourController = require('../controller/tourController');
const authController = require('../controller/authController');
const reviewRouter = require('../routes/reviewRoutes');

const Role = require('../utils/role');

const router = express.Router();

//mergeParams, because if we specify create review in tour controller it might confusing since we need to maintain 2 route
router.use('/:tourId/reviews', reviewRouter);

//this is middleware for parameter
//**important this is can triggering the middleware in bottom */
/**
 * this thing provide (req, res, next, val) with val is optional if you want use it.
 */
// router.param('id', tourController.checkID)
router.param('id', tourController.test);

//create a CheckBody middleware
//check if body contain key name and price property
//if not send back bad request

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistances);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo(
      Role.baseRole.ADMIN,
      Role.baseRole.LEAD_GUIDE,
      Role.baseRole.GUIDE
    ),
    tourController.getMonthlyPlan
  );

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo(Role.baseRole.ADMIN, Role.baseRole.LEAD_GUIDE),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  // .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo(Role.baseRole.ADMIN, Role.baseRole.LEAD_GUIDE),
    tourController.deleteTour
  );
/**
 * if you put middleware per route method request,
 * only provided (req, res, next) but if you provide `val` it will not triggerd
 */
router.route('/:id').patch(
  // tourController.checkID,
  // tourController.test,
  authController.protect,
  authController.restrictTo(Role.baseRole.ADMIN, Role.baseRole.LEAD_GUIDE),
  tourController.updateTour
);

module.exports = router;
