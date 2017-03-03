import $ from 'jquery';
import _ from 'underscore';
import Chart from 'chart.js';

const colors = [
  '#b3cffc',
  '#ffb5b5',
  '#ffd691',
  '#b2ffc5',
  '#d9b2ff',
  '#fff3b2',
  '#c0c9d1'
];

class AgentChart {
  constructor(agent) {
    this.agent = agent;
    this.states = [agent.state];

    this.stateDatasets = {};
    Object.keys(agent.state).map((k, i) => {
      var val = agent.state[k];
      if (typeof val == 'number') {
        this.stateDatasets[k] = {
          label: k,
          data: [val],
          backgroundColor: colors[i],
          borderColor: colors[i],
          fill: false,
          pointRadius: 0,
          pointBorderWidth: 0
        };
      }
    });

    this.el = $(`
      <div class="agent-info">
        <h1>${agent.id}</h1>
        <div class="agent-charts">
          <div class="agent-actions">
            <h2 class="agent-last-action"></h2>
          </div>
          <div class="agent-states"></div>
        </div>
      </div>`)
    this.stateCanvas = $('<canvas></canvas>');
    this.actionCanvas = $('<canvas></canvas>');
    this.el.find('.agent-states').append(this.stateCanvas);
    this.el.find('.agent-actions').append(this.actionCanvas);
    $('#charts').append(this.el);

    var options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          gridLines: {
            display: false
          },
          ticks: {
            beginAtZero: true
          }
        }],
        xAxes: [{
          gridLines: {
            display: false
          }
        }]
      }
    };

    this.stateChart = new Chart(this.stateCanvas, {
      type: 'line',
      data: {
        labels: [''],
        datasets: Object.values(this.stateDatasets)
      },
      options: options
    });

    this.actionTypes = this.agent.actionTypes;
    var actionColors = this.actionTypes.map((a, i) => colors[i]);
    this.actionChart = new Chart(this.actionCanvas, {
      type: 'bar',
      data: {
        labels: this.actionTypes,
        datasets: [{
          label: 'Actions',
          backgroundColor: actionColors,
          borderColor: actionColors,
          data: this.actionTypes.map(a => 0)
        }]
      },
      options: Object.assign({}, options, {legend: {display: false}})
    });
  }

  update() {
    this.states.push(this.agent.state);
    Object.keys(this.stateDatasets).map(k => {
      this.stateDatasets[k].data.push(this.agent.state[k]);
    });
    this.stateChart.data.labels = _.range(this.states.length).map(i => '');
    this.stateChart.data.datasets = Object.values(this.stateDatasets);
    this.stateChart.update();
    this.el.find('.agent-last-action').text(this.agent.lastAction.name);

    var actionIdx = this.actionTypes.indexOf(this.agent.lastAction.name);
    this.actionChart.data.datasets[0].data[actionIdx] += 1;
    this.actionChart.update();
  }
}

export default AgentChart;
