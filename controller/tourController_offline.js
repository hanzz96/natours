const fs = require('fs')
// const Tour = require('../models/tourModel')

const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
)

exports.checkID = (req, res, next) => {
    console.log(`tour Id is :`)
    const id = req.params.id * 1
    if (id > tours.length) {
        return res.status(404).json({
            status: 'Failed',
            message: 'Invalid ID',
        })
    }
    next()
}

exports.test = (req, res, next) => {
    console.log(`this is test()`)
    next()
}

exports.checkBody = (req, res, next) => {
    console.log(req.body, ' checkBody()')
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({
            status: 'Failed',
            message: 'Invalid Request',
        })
    }
    next()
}

exports.getAllTours = (req, res) => {
    console.log(req.requestTime)
    res.status(200).json({
        status: 'Success',
        requestedAt: req.requestTime,
        results: tours.length,
        data: {
            tours: tours,
        },
    })
}

exports.getTour = (req, res) => {
    console.log(req.params, 'this is the param')
    const id = req.params.id * 1
    const tourData = tours.find(x => {
        return x.id === id
    })

    res.status(200).json({
        status: 'Success',
        data: {
            tourData,
        },
    })
}

exports.createTour = (req, res) => {
    const newId = tours[tours.length - 1].id + 1

    const newTour = Object.assign(
        {
            id: newId,
        },
        req.body
    )

    tours.push(newTour)
    fs.writeFile(
        `${__dirname}/dev-data/data/tours-simple.json`,
        JSON.stringify(tours),
        err => {
            res.status(201).json({
                message: 'Success',
                data: {
                    tour: newTour,
                },
            })
        }
    )
    console.log(req.body)
}

exports.updateTour = (req, res) => {
    res.status(200).json({
        status: 'Success',
        message: 'Success updating',
    })
}

exports.deleteTour = (req, res) => {
    res.status(204).json({
        status: 'Success',
        data: null,
    })
}
