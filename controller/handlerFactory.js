const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apiFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No document found with that ID`, 404));
    }

    res.status(200).json({
      status: 'Success',
      message: 'Delete Success'
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const docUpdated = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //send updated data document
      //this is for run the validator in tourModel
      runValidators: true
    });

    if (!docUpdated) {
      return next(
        new AppError(`No document found with that ID for updating data`, 404)
      );
    }

    res.status(200).json({
      status: 'Success',
      message: 'Success updating',
      data: {
        data: docUpdated
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    // console.log(req.body);
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'Success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) {
      query = query.populate(popOptions);
    }

    const doc = await query;

    if (!doc) {
      return next(new AppError(`No document found with that ID`, 404));
    }

    res.status(200).json({
      status: 'Success',
      data: {
        doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //to allow for nested GET reviews, tricky
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    //real execution DB in here, its same like laravel ->get()
    //this is where before query executed, the query middleware will execute first. see tourModel.js
    const doc = await features.query;
    // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')
    // throw new Error('error woi');
    res.status(200).json({
      status: 'Success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
