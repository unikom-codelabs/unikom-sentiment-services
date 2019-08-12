const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

require('./app/services/facebookJob');
require('./app/services/instagramJob');
require('./app/services/twitterJob');

app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.send("Unikom Sentiment Services"));
app.use(require('./app/routes/routes'));

mongoose.connect(process.env.MONGO_URL, {useMongoClient: true});
mongoose.connection.on('error', () => console.log('Terjadi kesalahan saat membuat koneksi di MongoDB'));
mongoose.connection.on('open', () => console.log('Berhasil membuat koneksi di MongoDB'));

app.listen(port, () => console.log(`Listening on port ${port}`));
