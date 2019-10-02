const express = require('express');
const multer = require('multer');
const fs = require('fs');
const jsonfile = require('jsonfile');

const synapse = require('../model/synapse');
const ps = require('../model/preprocessing');
const router = express.Router();

var index = require('../controller/api/index');
const baseController = require('../controller/base_controller');
const indexController = require('../controller/index_controller');

router.get('/sentiment', baseController(req => indexController.getSentiments()));
router.get('/comment', index.getComment);
router.post('/upload-synapse', (req, res, next) => {
  var storage = multer.diskStorage({
    filename: function (req, file, callback) {
      console.log(file);
      callback(null, file.originalname);
    }
  });
  var upload = multer({
    storage: storage
  }).single('json');
  upload(req, res, function (err) {

    if (err)
      console.log(err);

    console.log(req.file.path);

    var file = req.file.path;
    jsonfile.readFile(file, function (err, obj) {
      const data = {
        synapse0: obj.synapse0,
        synapse1: obj.synapse1,
        words: obj.words
      }
      synapse.remove({}, () => {
        console.log('remove synapse');
      });
      var syn = new synapse(data);
      syn.save((err) => {
        if (err)
          console.log(err);

        res.json({
          status_code: 201,
          message: "Success upload synapse json"
        });
      });
    })

  });
});

router.post('/upload-ps', (req, res, next) => {

  var storage = multer.diskStorage({

    filename: function (req, file, callback) {
      console.log(file);
      callback(null, file.originalname);
    }
  });
  var upload = multer({
    storage: storage
  }).single('json');
  upload(req, res, function (err) {

    if (err)
      console.log(err);

    console.log(req.file.path);



    var file = req.file.path;
    jsonfile.readFile(file, function (err, obj) {
      const data = {
        data: obj
      }
      ps.remove({}, () => {
        console.log('remove ps');
      });
      var syn = new ps(data);
      syn.save((err) => {
        if (err)
          console.log(err);

        res.json({
          status_code: 201,
          message: "Success upload processing json"
        });
      });
    })

  });
});

module.exports = router;
