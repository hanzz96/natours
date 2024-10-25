const express = require('express');
const fs = require('fs');
const userController = require('../controller/userController');
const authController = require('../controller/authController');
const { baseRole } = require('../utils/role');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//from this point sequence it will protected
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe);

router.use(authController.restrictTo(baseRole.ADMIN));
router
  .route('/')
  .get(authController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
