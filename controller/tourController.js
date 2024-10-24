// const fs = require('fs');
const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// )

exports.test = (req, res, next) => {
  console.log(`this is test()`);
  next();
};

//injecting a query field limit, sort, fields
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  console.log(`middleware of aliasTopTours()`);
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  //real execution DB in here, its same like laravel ->get()
  //this is where before query executed, the query middleware will execute first. see tourModel.js
  const tours = await features.query;
  // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')
  // throw new Error('error woi');
  res.status(200).json({
    status: 'Success',
    results: tours.length,
    data: {
      tours: tours
    }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {

  const tourData = await Tour.findById(req.params.id);

  if (!tourData) {
    return next(new AppError(`No Tour found with that ID`, 404));
  }
  // Tour.findOne({_id : req.params.id})
  res.status(200).json({
    status: 'Success',
    data: {
      tourData
    }
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'Success',
    data: {
      tour: newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tourUpdated = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true, //send updated data document
    //this is for run the validator in tourModel
    runValidators: true
  });

  if (!tourUpdated) {
    return next(new AppError(`No Tour found with that ID`, 404));
  }

  res.status(200).json({
    status: 'Success',
    message: 'Success updating',
    data: {
      tour: tourUpdated
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError(`No Tour found with that ID`, 404));
  }

  res.status(200).json({
    status: 'Success',
    message: 'Delete Success'
  });
});

//aggregation pipeline == regular query
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    //example repeat stages
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'Success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: {
          $month: '$startDates'
        },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      //rename field _id into name month
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        //no longer shows up
        _id: 0
      }
    },
    {
      //-1 shows descending
      $sort: { numTourStarts: -1 }
    }
    //limit to 1 result
    // {
    //   $limit: 1
    // }
  ]);

  res.status(200).json({
    status: 'Success',
    data: {
      plan
    }
  });
});
