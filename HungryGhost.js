import _ from 'underscore';
import Agent from './app/Agent';

class HungryGhost extends Agent {
  update(delta) {
    super.update(delta);

    // check for tastier food
    var foods = this.world.objectsWithTag('food');
    if (foods.length > 0) {
      var bestFood = _.max(foods, f => f.props.tastiness || -1);
      var coord = _.sample(bestFood.adjacentCoords);
      if (this.food !== bestFood) {
        this.food = bestFood;
        this.goTo({
          x: coord.x,
          y: coord.y,
          floor: this.food.floor
        });
      }
    }
  }
}

export default HungryGhost;
