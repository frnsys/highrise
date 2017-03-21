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

  getEdge(from, to) {
    return this.edges[from][to];
  }

  setEdge(from, to, data) {
    return this.edges[from][to] = data;
  }

  hasEdge(from, to) {
    if (!(from in Object.keys(this.edges))) {
      return false;
    }
    return this.edges[from][to] === undefined || this.edges[from][t] === null;
  }
}

export default SocialNetwork;
