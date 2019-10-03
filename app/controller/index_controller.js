const jsonfile = require('jsonfile');

const Datatest = require('../model/datatest');
const Synapse = require('../model/synapse');
const Preprocesing = require('../model/preprocessing');


module.exports = {
  async getSentiments() {
    const [positif, negatif] = await Promise.all([
      Datatest.find({ 'comment.category': 'Positif' }).countDocuments().exec(),
      Datatest.find({ 'comment.category': 'Negatif' }).countDocuments().exec()
    ]);
    return { positif, negatif };
  },

  async getComments() {
    const datatest = await Datatest.aggregate([{
      $group: {
        _id: {
          date: '$date'
        },

        count: {
          $sum: 1
        }
      }
    }]).exec();
    return datatest;
  },

  async uploadSynapse(file) {
    const obj = jsonfile.readFileSync(file.path)
    
    await Synapse.remove({}).exec();
    const newSynapse = new Synapse({
      synapse0: obj.synapse0,
      synapse1: obj.synapse1,
      words: obj.words
    });

    await newSynapse.save();
    return {
      status_code: 201,
      message: "Success upload synapse json"
    };
  },

  async uploadPs(file) {
    const obj = jsonfile.readFileSync(file.path);
  
    await Preprocesing.remove();
    const newPreprocessing = new Preprocesing({
      data: obj
    });
    
    await newPreprocessing.save()
    return {
      status_code: 201,
      message: "Success upload processing json"
    };
  }
};