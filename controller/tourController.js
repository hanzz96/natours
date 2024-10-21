const fs = require('fs');
const Tour = require('../models/tourModel');

// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// )

exports.test = (req, res, next) => {
  console.log(`this is test()`);
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    //this is not work, should not do this, because if you mutate, the original gonna mutated also
    // const queryObj = req.query;
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    const { sort, fields } = req.query;

    excludedFields.forEach(el => delete queryObj[el]);

    //another way to use Tour.find(), simply use await in other variable for filtering page/sort
    let query = Tour.find(queryObj);

    //doSorting
    if (sort) {
      const sortBy = sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    //field limiting
    if(fields){
      const fieldList = x;
      query = query.select()
    }

    const tours = await query;

    // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')

    res.status(200).json({
      status: 'Success',
      results: tours.length,
      data: {
        tours: tours
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      message: 'Failed'
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    console.log(req.params, 'this is the param');

    const tourData = await Tour.findById(req.params.id);
    // Tour.findOne({_id : req.params.id})
    res.status(200).json({
      status: 'Success',
      data: {
        tourData
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      message: 'Failed'
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    console.log(req.body);
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'Success',
      data: {
        tour: newTour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      //its just for now, we will refactor with errorHandling
      message: err
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tourUpdated = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //send updated data document
      runValidators: true
    });

    res.status(200).json({
      status: 'Success',
      message: 'Success updating',
      data: {
        tour: tourUpdated
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      //its just for now, we will refactor with errorHandling
      message: 'Update Failed!'
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: 'Success',
      message: 'Delete Success'
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      //its just for now, we will refactor with errorHandling
      message: 'Delete Failed!'
    });
  }
};
