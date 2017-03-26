class SocialNetwork {
  constructor() {
    this.nodes = [];
    this.edges = {};
  }

  addEdge(from, to, data) {
    data = data || {};
    if (!(to in this.nodes)) this.nodes.push(to);
    if (!(from in this.nodes)) this.nodes.push(from);
    if (!(from in this.edges)) {
      this.edges[from] = {};
    }
    this.edges[from][to] = data;
  }

  incrementEdge(from, to, data) {
    console.log("===");
    data = data || {};
    if (!(to in this.nodes)) this.nodes.push(to);
    if (!(from in this.nodes)) this.nodes.push(from);
    if (!(from in this.edges)) {  this.edges[from] = {};  }
    // works ONLY for affinity
    if(!(to in this.edges[from])) {
      this.edges[from][to] = data;
    } else {
      if(!('affinity' in this.edges[from][to])) { this.edges[from][to].affinity = 0; }
      console.log(data.affinity)
      this.edges[from][to].affinity += data.affinity;
    }
    console.log(this.edges[from][to]);
  }

  getEdge(from, to) {
    return this.edges[from][to];
  }

  getAffinity(from, to) {
    try {
      return this.edges[from][to].affinity;
    } catch(err) {
      return 0;
    }
  }

  setEdge(from, to, data) {
    return this.edges[from][to] = data;
  }

  hasEdge(from, to) {
    if (!(from in this.edges)) {
      return false;
    }
    return this.edges[from][to] === undefined || this.edges[from][to] === null;
  }
}

export default SocialNetwork;
