const fb = require('fb');
const moment = require('moment');
const axios = require('axios');

const CronJob = require('cron').CronJob;

const Datatest = require('../model/datatest');
const DatatestPreprocessed = require('../model/datatests-preprocesseds');

const onFacebookError = error => {
  console.log('Terjadi kesalahan');
  console.log(error);
};
const getCategory = hasil => {
  if (hasil.length > 1) {
    if (hasil[0][1] > hasil[1][1]) {
      return hasil[0][0]
    } else {
      return hasil[1][0];
    }
  }

  return hasil[0][0];
};
const onDocAlreadyExist = message => console.log(`${message} already exist`);
const getPosts = id => {
  fb.api(`/${id}/posts`, response => {
    if (!response || response.error) return onFacebookError(response.error);

    response.data.forEach(val => {
      const comments = [];
      const announcement = {
        text: val.message
      };

      fb.api(`/${val.id}/comments`, response => {
        announcement.commentCount = response.data.length;
        if (!response || response.error) return onFacebookError(response.error);

        response.data.forEach(comment => {
          Datatest.find({
              "comment.comment": comment.message,
              date: moment().format('DD-MM-YYYY')
            }).exec()
            .then(doc => {
              if (doc.length > 0) return onDocAlreadyExist(comment.message);

              let category = '';
              const texts = JSON.stringify({
                Inputs: {
                  input1: [{
                    Tweet: comment.message,
                    Label: ''
                  }]
                },
                GlobalParameters: {}
              });
              axios.post('https://unikom-sentiment.herokuapp.com/api/v1/classify', {
                  text: comment.message
                })
                .then(response => {
                  if (response.data.status_code === 400) return;
                  category = getCategory(response.data.result);

                  comments.push({
                    comment: comment.message,
                    category: category,
                    date: moment().format('DD-MM-YYYY')
                  });
                  const savedWord = new DatatestPreprocessed({
                    text: response.data.words,
                    date: moment().format('DD-MM-YYYY'),
                    category: category
                  });
                  savedWord.save().catch(err => console.log(err));

                  if (category === null) return console.log('Not train');

                  Datatest.find({
                      text: announcement.text,
                      date: moment().format('DD-MM-YYYY')
                    }).exec()
                    .then(doc => {
                      if (doc.length > 0) return onDocAlreadyExist(announcement.text);

                      axios.post('https://unikom-sentiment.herokuapp.com/api/v1/classify', {
                          text: announcement.text
                        })
                        .then(response => {
                          if (response.data.status_code === 400) return;
                          const category = getCategory(category);
                          const Train = new Datatest({
                            source: 'Facebook',
                            text: annoucement.text,
                            foto_sender: 'none.jpg',
                            category: category,
                            date: moment().format('DD-MM-YYYY'),
                            commentCount: comments.length,
                            comment: comments
                          });
                          Train.save().catch(err => console.log(err));
                        })
                        .catch(error => console.log(error.response));
                    })
                    .catch(err => console.log(err));
                })
                .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
        });
      });
    });
  })
};

fb.setAccessToken(process.env.FACEBOOK_ACCESS_TOKEN);
new CronJob({
  cronTime: '59 59 23 * * *',
  start: true,
  timeZone: 'Asia/Jakarta',
  onTick() {
    console.log('Check fanspage Unikom Codelabs...');
    getPosts('161399257352851');
  }
});

new CronJob({
  cronTime: '59 59 23 * * *',
  start: true,
  timeZone: 'Asia/Jakarta',
  onTick() {
    console.log("check fanspage Unikom Masterpiece...");
    getPosts('985904061511946');
  }
});