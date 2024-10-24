const express = require('express');
const tourController = require('../controller/tourController');
const authController = require('../controller/authController');
const Role = require('../utils/role');

const router = express.Router();
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
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);

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
  tourController.updateTour
);

module.exports = router;
