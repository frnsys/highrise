class SocialNetwork {
  constructor() {
    this.nodes = [];
    this.edges = {};
  }

  addEdge(from, to, data) {
    data = data || {};
    if (!(to in this.nodes)) this.nodes.push(to);
    if (!(from in this.nodes)) this.nodes.push(from);
    if (!(from in Object.keys(this.edges))) {
      this.edges[from] = {};
    }
    this.edges[from][to] = data;
  }
}

export default SocialNetwork;
