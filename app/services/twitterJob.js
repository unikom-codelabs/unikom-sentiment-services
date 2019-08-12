const axios = require('axios');
const moment = require('moment');
const Twit = require('twit');

const CronJob = require('cron').CronJob;

const Datatest = require('../model/datatest');
const DatatestPreprocessed = require('../model/datatests-preprocesseds');

const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET,
  timeout_ms: 60 * 1000
});

new CronJob({
  cronTime: '59 59 23 * * *',
  start: true,
  timeZone: 'Asia/Jakarta',
  onTick() {
    const onDocFound = text => {
      let category = '';
      axios.post('https://unikom-sentiment.herokuapp.com/api/v1/classify', {text})
          .then(response => {
            const hasil = response.data.result;
            if (hasil.length > 1) {
              if (hasil[0][1] > hasil[1][1]) {
                category = hasil[0][0]
              } else {
                category = hasil[1][0];
              }
            } else {
              category = hasil[0][0];
            }
            const savedWord = new DatatestPreprocessed({
              text: response.data.words,
              date: moment().format('DD-MM-YYYY'),
              category: category
            });
            savedWord.save();
          })
          .catch(error => console.log(error.response));
    };

    console.log("Cek keyword Unikom di Twitter");
    T.get('search/tweets', {q: 'unikom', count: 400}, (err, data) => {
      data.statuses.forEach(comment => {
        Datatest.find({text: comment.text, source: 'Twitter'}).exec()
            .then(doc => {
              if (doc.length <= 0) onDocFound(comment.text)
            })
            .catch(error => console.log({error}));
      });
    });
  }
});

const classifyTextAndSaved = (message, tweet) => {
  console.log(message);
  console.log(tweet.text);
  axios.post('https://unikom-sentiment.herokuapp.com/api/v1/classify', {
    text: tweet.text
  })
      .then(response => {
        let category = '';
        const hasil = response.data.result;
        if (hasil.length > 1) {
          if (hasil[0][1] > hasil[1][1]) {
            category = hasil[0][0]
          } else {
            category = hasil[1][0];
          }
        } else {
          category = hasil[0][0];
        }
        const saveWord = new DatatestPreprocessed({
          text: response.data.words,
          date: moment().format('DD-MM-YYYY'),
          category: category
        });
        saveWord.save();
      })
      .catch(error => console.log({error}));
};


console.log('Memulai stream unikom');
const unikomStream = T.stream('statuses/filter', {track: 'unikom'});
unikomStream.on('tweet', tweet => classifyTextAndSaved(
    'Menemukan sebuah tweet dengan kata unikom',
    tweet
));

console.log('Memulai stream unikom hits');
const unikomHitsStream = T.stream('statuses/filter', {track: '#unikomhits'});
unikomHitsStream.on('tweet', tweet => classifyTextAndSaved(
    'Menemukan sebuah tweet dengan hashtag #unikomhits',
    tweet
));

