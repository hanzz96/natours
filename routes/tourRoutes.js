const express = require('express');
const tourController = require('../controller/tourController');

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
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  // .patch(tourController.updateTour)
  .delete(tourController.deleteTour);
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
