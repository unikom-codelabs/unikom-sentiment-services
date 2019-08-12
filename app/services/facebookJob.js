const fb = require('fb');
const CronJob = require('cron').CronJob;
const ig = require('instagram-tagscrape');
const axios = require('axios');
const async = require('async');
const request = require('request');
const uji = require('../model/datatest');
const words = require('../model/datatests-preprocesseds');

const requestAccessToken = () => {
  fb.api('oauth/access_token', {
    client_id: '2649179385101865',
    client_secret: '06120210f501f09dbec0f8f5d9af7ee3',
    grant_type: 'client_credentials'
  }, res => {
    if (!res || res.error) {
      console.log(!res ? 'Terjadi kesalahan saat meminta access_token' : res.error);
      return;
    }

    console.log('Berhasil mendapatkan access_token');
    fb.setAccessToken(res.access_token);
  });
};

requestAccessToken();
const cronAccessToken = new CronJob({
  cronTime: '0 0 23 * * * *',
  start: true,
  onTick() {
    console.log('Mendapatkan access_token baru dari Facebook');
    requestAccessToken();
  }
});

new CronJob({
  cronTime: '59 59 23 * * * *',
  start: true,
  timeZone: 'Asia/Jakarta',
  onTick() {
    console.log("Check fanspage Unikom Codelabs...");
    fb.api("/unikom.codelabs/posts", (response) => {
      console.log(response);
      if (response && !response.error) {
        (response.data).forEach((val) => {
          var annoucement = {};
          var comments = [];
          annoucement.text = val.message;
          console.log(val.id);
          async.waterfall([
            function (callback) {
              fb.api("/" + val.id + "/comments", (response) => {
                annoucement.commentCount = (response.data).length;
                if (response && !response.error) {
                  (response.data).forEach((comment) => {
                    async.waterfall([
                      function (callback) {
                        var check = uji.find({"comment.comment": comment.message, date: today()}, (err, doc) => {
                          if (doc.length > 0) {
                            console.log("Already exist");
                          } else {
                            var category = '';
                            const texts = JSON.stringify({

                              "Inputs": {
                                "input1": [
                                  {
                                    "Tweet": comment.message,
                                    "Label": ""
                                  }
                                ]
                              },
                              "GlobalParameters": {}

                            });
                            // var categorys = request({
                            //     url: 'https://asiasoutheast.services.azureml.net/subscriptions/7a38336d77ae429085b6d8af7c3b5eeb/services/659fde210c144dadba90d67bc22cb27a/execute?api-version=2.0&format=swagger', //URL to hit
                            //     method: 'POST',
                            //      headers: {
                            //         'Content-Type': 'application/json',
                            //         'Authorization':'Bearer genpswgJfhwA1jw45nF92Abi6N/grBgdWUDG6sBJwAFKpN3XgjLqnBAjD8QJyC6oBZXWfwyZDW+8gijB2/jy4w=='
                            //      },
                            //     body:texts
                            //      }, function(error, response, body){
                            //     if(error) {
                            //        console.log(error);
                            //     }
                            //     //console.log(body);
                            //     let bodies = JSON.parse(body);
                            //     console.log(bodies);
                            //     let cats = bodies.Results.output1;
                            //      cats.forEach(function(category){
                            //         //console.log(category['Scored Labels'] );
                            //         if(category['Scored Labels'] === 'Negatif'){
                            //             category = "Negatif"
                            //         }else if(category['Scored Labels'] === 'Positif'){
                            //             category = "Positif"
                            //         }
                            //         comments.push({
                            //             comment : comment.message,
                            //             category : category,
                            //             date : today()
                            //         })
                            //         // var saveWord = new words({text : response.data.words, date : today(), category : category });
                            //         //         saveWord.save();
                            //                 callback(null, category);
                            //      });
                            //   });
                            axios.post('https://unikom-sentiment.herokuapp.com/api/v1/classify', {
                              text: comment.message
                            })
                                .then(function (response) {
                                  // console.log(response.data)
                                  if (response.data.status_code !== 400) {
                                    var hasil = (response.data).result;
                                    if (hasil.length > 1) {
                                      if (hasil[0][1] > hasil[1][1]) {
                                        category = hasil[0][0]
                                      } else {
                                        category = hasil[1][0];
                                      }
                                    } else {
                                      category = hasil[0][0];
                                    }
                                    comments.push({
                                      comment: comment.message,
                                      category: category,
                                      date: today()
                                    })
                                    console.log(response.data.words);
                                    var saveWord = new words({
                                      text: response.data.words,
                                      date: today(),
                                      category: category
                                    });
                                    saveWord.save();
                                    callback(null, category);
                                  }
                                  callback(null, null);

                                })
                                .catch(function (error) {
                                  console.log(error.response);
                                });
                          }
                        });


                      }

                    ], function (err, result) {
                      if (result !== null) {
                        console.log(annoucement);
                        var check = uji.find({text: annoucement.text, date: today()}, (err, doc) => {

                          if (doc.length > 0) {
                            console.log("Already exist 2");
                            // var tanggal = today();
                            // if(comments.length > 0){
                            //   uji.findOneAndUpdate({_id : doc[0]._id}, {$set :{
                            //     date : today()
                            //    },
                            //    $push:{
                            //       comment : comments
                            //    }
                            //   }, (err, docs)=>{
                            //       if(err)
                            //           console.log(err)

                            //        console.log("updated facebook post");
                            //   })
                            // }
                            //   const data = {
                            //     source: 'Facebook',
                            //     text: annoucement.text,
                            //     foto_sender: 'none.jpg',
                            //     category: 'Positif',
                            //     date : tanggal,
                            //     commentCount : comments.length,
                            //     comment : comments
                            // }

                            // var Train = new uji(data);
                            // Train.save((err) => {
                            //     if (err)
                            //         console.log(err);

                            //     console.log("saved facebook");
                            // })

                          } else {
                            axios.post('https://unikom-sentiment.herokuapp.com/api/v1/classify', {
                              text: annoucement.text
                            })
                                .then(function (response) {
                                  // console.log(response.data)
                                  let category = '';
                                  if (response.data.status_code !== 400) {
                                    var hasil = (response.data).result;
                                    if (hasil.length > 1) {
                                      if (hasil[0][1] > hasil[1][1]) {
                                        category = hasil[0][0]
                                      } else {
                                        category = hasil[1][0];
                                      }
                                    } else {
                                      category = hasil[0][0];
                                    }
                                    var tanggal = today();
                                    const data = {
                                      source: 'Facebook',
                                      text: annoucement.text,
                                      foto_sender: 'none.jpg',
                                      category: category,
                                      date: tanggal,
                                      commentCount: comments.length,
                                      comment: comments
                                    }

                                    var Train = new uji(data);
                                    Train.save((err) => {
                                      if (err)
                                        console.log(err);

                                      console.log("saved facebook");
                                    })

                                  }

                                })
                                .catch(function (error) {
                                  console.log(error.response);
                                });

                          }
                        });
                      } else {
                        console.log("not train");
                      }
                    });
                  });
                } else {
                  console.log(response.error);
                }
              });
            }
          ]);
        });
      }
    });
  }
});

// /**
//  GET REACTIONS
//  */
// // const cronReact = new CronJob({
// //   cronTime: '0 */50 * * * *',
//
// //   onTick() {
// //     console.log("check fanspage to get reaction..")
// //         fb.api("/165292613289?fields=posts.as(like){reactions.type(LIKE).limit(0).summary(true)}, posts.as(love){reactions.type(LOVE).limit(0).summary(true)}, posts.as(wow){reactions.type(WOW).limit(0).summary(true)},   posts.as(haha){reactions.type(HAHA).limit(0).summary(true)},   posts.as(sad){reactions.type(SAD).limit(0).summary(true)},   posts.as(angry){reactions.type(ANGRY).limit(0).summary(true)},   posts.as(thankful){reactions.type(THANKFUL).limit(0).summary(true)}", (response)=> {
//
// //                 if (response && !response.error) {
// //                     // console.log(response);
//
// //                   async.parallel({
// //                       like : (callback)=>{
// //                         (response.like).forEach((react)=>{
//
// //                         })
// //                       },
// //                       wow : (callback)=>{
//
// //                       },
// //                       thankful : (callback)=>{
//
// //                       },
// //                       love : (callback)=>{
// //                       },
// //                       sad : (callback)=>{
//
// //                       },
// //                       haha : (callback)=>{
//
// //                       }
//
// //                   }, function(err, result){
//
// //                   });
// //               } //fb get post if
// //     }); //fb post
// //   },
//
// //   start: true,
// //   timeZone: 'Asia/Jakarta',
// // });
// /**
//  GET Comment UNIKOM Master Piece
//  */
// const cronMasterPiece = new CronJob({
//   cronTime: '0 */59 * * * *',
//
//   onTick() {
//     console.log("check fanspage master ..")
//     fb.api("/985904061511946/posts", (response) => {
//
//       if (response && !response.error) {
//         // console.log(response);
//
//         (response.data).forEach((val) => {
//           var annoucement = {};
//           var comments = [];
//           annoucement.text = val.message;
//           console.log(val.id);
//           async.waterfall([
//             function (callback) {
//               fb.api("/" + val.id + "/comments", (response) => {
//                 if (response && !response.error) {
//                   (response.data).forEach((comment) => {
//                     async.waterfall([
//                       function (callback) {
//                         var check = uji.find({text: comment.message, date: today()}, (err, doc) => {
//                           if (doc.length > 0) {
//                             console.log("Already exist");
//                           } else {
//                             var category = '';
//                             const texts = JSON.stringify({
//
//                               "Inputs": {
//                                 "input1": [
//                                   {
//                                     "Tweet": comment.message,
//                                     "Label": ""
//                                   }
//                                 ]
//                               },
//                               "GlobalParameters": {}
//
//                             });
//                             // var categorys = request({
//                             //     url: 'https://asiasoutheast.services.azureml.net/subscriptions/7a38336d77ae429085b6d8af7c3b5eeb/services/659fde210c144dadba90d67bc22cb27a/execute?api-version=2.0&format=swagger', //URL to hit
//                             //     method: 'POST',
//                             //      headers: {
//                             //         'Content-Type': 'application/json',
//                             //         'Authorization':'Bearer genpswgJfhwA1jw45nF92Abi6N/grBgdWUDG6sBJwAFKpN3XgjLqnBAjD8QJyC6oBZXWfwyZDW+8gijB2/jy4w=='
//                             //      },
//                             //     body:texts
//                             //      }, function(error, response, body){
//                             //     if(error) {
//                             //        console.log(error);
//                             //     }
//                             //     //console.log(body);
//                             //     let bodies = JSON.parse(body);
//                             //     console.log(bodies);
//                             //     let cats = bodies.Results.output1;
//                             //      cats.forEach(function(category){
//                             //         //console.log(category['Scored Labels'] );
//                             //         if(category['Scored Labels'] === 'Negatif'){
//                             //             category = "Negatif"
//                             //         }else if(category['Scored Labels'] === 'Positif'){
//                             //             category = "Positif"
//                             //         }
//                             //         // var saveWord = new words({text : response.data.words, date : today(), category : category });
//                             //         //         saveWord.save();
//                             //                 callback(null, category);
//                             //      });
//                             //   });
//                             axios.post('https://unikom-sentiment.herokuapp.com/api/v1/classify', {
//                               text: comment.message
//                             })
//                                 .then(function (response) {
//                                   // console.log(response.data)
//                                   if (response.data.status_code !== 400) {
//                                     var hasil = (response.data).result;
//                                     if (hasil.length > 1) {
//                                       if (hasil[0][1] > hasil[1][1]) {
//                                         category = hasil[0][0]
//                                       } else {
//                                         category = hasil[1][0];
//                                       }
//                                     } else {
//                                       category = hasil[0][0];
//                                     }
//                                     comments.push({
//                                       comment: comment.message,
//                                       category: category,
//                                       date: today()
//                                     })
//                                     var saveWord = new words({
//                                       text: response.data.words,
//                                       date: today(),
//                                       category: category
//                                     });
//                                     saveWord.save();
//                                     callback(null, category);
//                                   }
//                                   callback(null, null);
//
//                                 })
//                                 .catch(function (error) {
//                                   console.log(error.response);
//                                 });
//                           }
//                         });
//
//
//                       }
//
//                     ], function (err, result) {
//                       if (result !== null) {
//                         var check = uji.find({text: annoucement.text, date: today()}, (err, doc) => {
//
//                           if (doc.length > 0) {
//                             console.log("Already exist 2");
//                           } else {
//                             var tanggal = today();
//                             const data = {
//                               source: 'Facebook',
//                               text: annoucement.text,
//                               foto_sender: 'none.jpg',
//                               category: 'Positif',
//                               date: tanggal,
//                               commentCount: comments.length,
//                               comment: comments
//                             }
//
//                             var Train = new uji(data);
//                             Train.save((err) => {
//                               if (err)
//                                 console.log(err);
//
//                               console.log("saved facebook");
//                             })
//                           }
//                         });//end find
//                       } else {
//                         console.log("not train");
//                       }
//
//                     }); //end waterfall
//                   }); //endforeach
//                 } else {
//                   console.log(response.error);
//                 }
//               }); //end facebook
//             }
//           ]); //end waterfall
//         }); //endforeach
//       } //fb get post if
//     }); //fb post
//   },
//
//   start: true,
//   timeZone: 'Asia/Jakarta',
// });
