const express = require('express');
const multer = require('multer');
const fs = require('fs');

const ps = require('../model/preprocessing');

const storage = multer.diskStorage({
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  }
});
const upload = multer({ storage })

const baseController = require('../controller/base_controller');
const indexController = require('../controller/index_controller');

const router = express.Router();
router.get('/sentiment', baseController(() => indexController.getSentiments()));
router.get('/comment', baseController(() => indexController.getComments()));
router.post('/upload-synapse', upload.single('json'), baseController(req => indexController.uploadSynapse(req.file)))
router.post('/upload-ps', upload.single('json'), baseController(req => indexController.uploadPs(req.file)));

module.exports = router;
