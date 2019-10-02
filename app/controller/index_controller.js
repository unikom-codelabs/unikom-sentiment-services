const Datatest = require('../model/datatest');

module.exports = {
  async getSentiments() {
    const [positif, negatif] = await Promise.all([
      Datatest.find({ 'comment.category': 'Positif' }).countDocuments().exec(),
      Datatest.find({ 'comment.category': 'Negatif' }).countDocuments().exec()
    ]);
    return { positif, negatif };
  }
};