class DialogueScoreSpace {
  constructor(scores) {
    this.scores = scores;
  }
  findClosest(targetScore) {
    // find the closest topic to target score
    var x = targetScore[0]; var y = targetScore[1];
    return _.chain(this.scores)
      .sortBy((o) => { return this.euclideanDist(targetScore, o.score); })
      .value()[0];
  }
  findRandom() {
    return _.chain(this.scores)
      .sample()
      .value();
  }
  findFromPercentClosest(targetScore, perc) { // perc = from 0 - 1;
    // find the top x percent closest to targetScore, and pick randomly
    var x = targetScore[0]; var y = targetScore[1];
    var topNum = _.ceil(this.scores.length * perc)
    return _.chain(this.scores)
      .sortBy([(o) => { return this.euclideanDist(targetScore, o.score); }])
      .slice(0, topNum)
      .sample()
      .value();
  }
  findWithThreshold(targetScore, thresh) { // thresh = ideally from 0 - 1;
    // find w random threshold -- aka randomly move the targetscore w/ threshold 
    var x = targetScore[0] + _.random((thresh / -2), (thresh / 2), true);
    var y = targetScore[1] + _.random((thresh / -2), (thresh / 2), true);
    return this.findClosest([x, y])
  }
  euclideanDist(coordA, coordB) {
    return Math.sqrt(Math.pow(coordA[0] - coordB[0], 2) + Math.pow(coordA[1] - coordB[1], 2) )
  }
}

module.exports = DialogueScoreSpace
