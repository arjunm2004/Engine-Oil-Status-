const CHANNEL_ID = '2914458';
const API_KEY = '5JLTLX1G07R1A7PF';

const fields = {
  oilQuality: 1,
  oilPurity: 2,
  temperature: 3,
  oilLevel: 4
};

let liveMode = true;
let updateInterval;
let currentHistoryData = [];

function updateStatus() {
  if (!liveMode) return;

  fetch(`https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json?api_key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data && data.created_at) {
        document.getElementById('current-date').textContent = formatDateTime(new Date(data.created_at));
      }
      updateUI(data);
    })
    .catch(error => console.error('Error fetching data:', error));
}

function updateUI(data) {
  if (!data) return;

  if (data[`field${fields.oilQuality}`] !== undefined) {
    const value = data[`field${fields.oilQuality}`];
    const status = mapOilQuality(value);
    document.getElementById('value-oil-quality').textContent = value;
    document.getElementById('status-oil-quality').textContent = status;
    document.getElementById('status-oil-quality').setAttribute('data-status', status);
  }

  if (data[`field${fields.oilPurity}`] !== undefined) {
    const value = data[`field${fields.oilPurity}`];
    const status = mapOilPurity(value);
    document.getElementById('value-oil-purity').textContent = value + ' μS/cm';
    document.getElementById('status-oil-purity').textContent = status;
    document.getElementById('status-oil-purity').setAttribute('data-status', status);
  }

  if (data[`field${fields.temperature}`] !== undefined) {
    const value = data[`field${fields.temperature}`];
    const status = mapTemperature(value);
    document.getElementById('value-temperature').textContent = value + ' °C';
    document.getElementById('status-temperature').textContent = status;
    document.getElementById('status-temperature').setAttribute('data-status', status);
  }

  if (data[`field${fields.oilLevel}`] !== undefined) {
    const value = data[`field${fields.oilLevel}`];
    const status = mapOilLevel(value);
    document.getElementById('value-oil-level').textContent = value;
    document.getElementById('status-oil-level').textContent = status;
    document.getElementById('status-oil-level').setAttribute('data-status', status);
  }
}

function toggleGraph(id, fieldNum) {
  const graph = document.getElementById(id);
  if (graph.style.display === 'none' || graph.style.display === '') {
    graph.style.display = 'block';
    if (liveMode) {
      graph.innerHTML = `
        <iframe width="100%" height="300" style="border:1px solid #ddd; border-radius:5px;"
          src="https://thingspeak.com/channels/${CHANNEL_ID}/charts/${fieldNum}?bgcolor=%23ffffff&color=%23d62020&dynamic=true&type=line&results=60">
        </iframe>`;
    } else {
      graph.innerHTML = `
        <div style="height:300px; width:100%" id="chart-${id}"></div>
      `;
      drawChart(`chart-${id}`, currentHistoryData, fieldNum);
    }
  } else {
    graph.style.display = 'none';
    graph.innerHTML = '';
  }
}

function mapOilQuality(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return 'Unknown';
  return num >= 80 ? 'Good' : num >= 40 ? 'Moderate' : 'Bad';
}

function mapOilPurity(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return 'Unknown';
  return num >= 80 ? 'Good' : num >= 50 ? 'Moderate' : 'Bad';
}

function mapTemperature(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return 'Unknown';
  return num <= 80 ? 'Normal' : 'Overheat';
}

function mapOilLevel(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return 'Unknown';
  return num < 1 ? 'Low' : 'Good';
}

function toggleMode() {
  liveMode = document.getElementById('mode-toggle').checked;
  document.getElementById('mode-label').textContent = liveMode ? 'Live' : 'History';
  document.getElementById('history-controls').style.display = liveMode ? 'none' : 'block';
  document.getElementById('stats-summary').style.display = liveMode ? 'none' : 'block';
  
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  if (liveMode) {
    updateStatus();
    updateInterval = setInterval(updateStatus, 15000);
    document.getElementById('date-picker').value = '';
    document.getElementById('stats-summary').innerHTML = '';
    displayCurrentDate();
  } else {
    const selectedDate = document.getElementById('date-picker').value || new Date().toISOString().split('T')[0];
    document.getElementById('date-picker').value = selectedDate;
    fetchHistoryData();
  }
  
  updateVisibleGraphs();
}

function updateVisibleGraphs() {
  const graphs = [
    {id: 'graph-oil-quality', field: 1},
    {id: 'graph-oil-purity', field: 2},
    {id: 'graph-temperature', field: 3},
    {id: 'graph-oil-level', field: 4}
  ];
  
  graphs.forEach(graph => {
    const element = document.getElementById(graph.id);
    if (element.style.display === 'block') {
      element.style.display = 'none';
      element.innerHTML = '';
      toggleGraph(graph.id, graph.field);
    }
  });
}

async function fetchHistoryData() {
  const dateStr = document.getElementById('date-picker').value;
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);

  const tzOffset = start.getTimezoneOffset() * 60000;
  const startISO = new Date(start - tzOffset).toISOString();
  const endISO = new Date(end - tzOffset).toISOString();

  try {
    const response = await fetch(`https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${API_KEY}&start=${startISO}&end=${endISO}`);
    const data = await response.json();
    
    if (data.feeds && data.feeds.length > 0) {
      currentHistoryData = data.feeds;
      updateUI(data.feeds[data.feeds.length - 1]);
      updateStatsSummary(data.feeds);
      updateGraphsWithHistory(data.feeds);
    } else {
      alert("No data found for selected date.");
    }
  } catch (error) {
    console.error('Error fetching historical data:', error);
    alert("Error loading historical data. Please try again.");
  }
}

function updateStatsSummary(feeds) {
  const stats = {
    oilQuality: { values: [], min: 0, max: 0, avg: 0 },
    oilPurity: { values: [], min: 0, max: 0, avg: 0 },
    temperature: { values: [], min: 0, max: 0, avg: 0 },
    oilLevel: { values: [], min: 0, max: 0, avg: 0 }
  };

  feeds.forEach(feed => {
    if (feed.field1) stats.oilQuality.values.push(parseFloat(feed.field1));
    if (feed.field2) stats.oilPurity.values.push(parseFloat(feed.field2));
    if (feed.field3) stats.temperature.values.push(parseFloat(feed.field3));
    if (feed.field4) stats.oilLevel.values.push(parseFloat(feed.field4));
  });

  Object.keys(stats).forEach(key => {
    if (stats[key].values.length > 0) {
      stats[key].min = Math.min(...stats[key].values).toFixed(2);
      stats[key].max = Math.max(...stats[key].values).toFixed(2);
      stats[key].avg = (stats[key].values.reduce((a, b) => a + b, 0) / stats[key].values.length).toFixed(2);
    }
  });

  const statsHtml = `
    <h3>Statistics Summary</h3>
    <div class="stat-item">
      <span><strong>Oil Quality:</strong></span>
      <span>Min: ${stats.oilQuality.min} | Max: ${stats.oilQuality.max} | Avg: ${stats.oilQuality.avg}</span>
    </div>
    <div class="stat-item">
      <span><strong>Oil Purity:</strong></span>
      <span>Min: ${stats.oilPurity.min} μS/cm | Max: ${stats.oilPurity.max} μS/cm | Avg: ${stats.oilPurity.avg} μS/cm</span>
    </div>
    <div class="stat-item">
      <span><strong>Temperature:</strong></span>
      <span>Min: ${stats.temperature.min} °C | Max: ${stats.temperature.max} °C | Avg: ${stats.temperature.avg} °C</span>
    </div>
    <div class="stat-item">
      <span><strong>Oil Level:</strong></span>
      <span>Min: ${stats.oilLevel.min} | Max: ${stats.oilLevel.max} | Avg: ${stats.oilLevel.avg}</span>
    </div>
  `;
  
  document.getElementById('stats-summary').innerHTML = statsHtml;
  document.getElementById('stats-summary').style.display = 'block';
}

function exportData() {
  if (currentHistoryData.length === 0) {
    alert("No data available to export.");
    return;
  }

  let csv = 'Timestamp,Oil Quality,Oil Purity (μS/cm),Temperature (°C),Oil Level\n';
  
  currentHistoryData.forEach(feed => {
    const date = new Date(feed.created_at);
    const timestamp = date.toLocaleString();
    csv += `${timestamp},${feed.field1 || ''},${feed.field2 || ''},${feed.field3 || ''},${feed.field4 || ''}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `oil_data_${document.getElementById('date-picker').value}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function updateGraphsWithHistory(feeds) {
  const graphs = [
    {id: 'graph-oil-quality', field: 1},
    {id: 'graph-oil-purity', field: 2},
    {id: 'graph-temperature', field: 3},
    {id: 'graph-oil-level', field: 4}
  ];
  
  graphs.forEach(graph => {
    const element = document.getElementById(graph.id);
    if (element.style.display === 'block') {
      element.innerHTML = `
        <div style="height:300px; width:100%" id="chart-${graph.id}"></div>
      `;
      drawChart(`chart-${graph.id}`, feeds, graph.field);
    }
  });
}

function drawChart(containerId, feeds, fieldNum) {
  const dataPoints = feeds.map(feed => ({
    x: new Date(feed.created_at),
    y: parseFloat(feed[`field${fieldNum}`]) || 0
  }));
  
  const chart = new CanvasJS.Chart(containerId, {
    title: { 
      text: getFieldName(fieldNum) + ' History',
      fontSize: 16
    },
    axisX: { 
      title: "Time",
      valueFormatString: "HH:mm",
      labelAngle: -45
    },
    axisY: { 
      title: getFieldUnit(fieldNum),
      includeZero: false
    },
    data: [{
      type: "line",
      dataPoints,
      color: "#3498db",
      lineThickness: 2
    }],
    zoomEnabled: true,
    panEnabled: true,
    zoomType: "xy",
    exportEnabled: true
  });
  chart.render();
}

function getFieldName(fieldNum) {
  switch(fieldNum) {
    case 1: return 'Oil Quality';
    case 2: return 'Oil Purity';
    case 3: return 'Temperature';
    case 4: return 'Oil Level';
    default: return 'Field ' + fieldNum;
  }
}

function getFieldUnit(fieldNum) {
  switch(fieldNum) {
    case 2: return 'μS/cm';
    case 3: return '°C';
    default: return 'Value';
  }
}

function formatDateTime(date) {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
}

function displayCurrentDate() {
  document.getElementById('current-date').textContent = formatDateTime(new Date());
}

function init() {
  displayCurrentDate();
  
  const datePicker = document.getElementById('date-picker');
  const today = new Date().toISOString().split('T')[0];
  datePicker.setAttribute('max', today);
  datePicker.value = today;
  
  document.getElementById('mode-toggle').checked = true;
  document.getElementById('mode-label').textContent = 'Live';
  
  document.getElementById('mode-toggle').addEventListener('change', toggleMode);
  
  updateStatus();
  updateInterval = setInterval(() => {
    if (liveMode) {
      displayCurrentDate();
      updateStatus();
    }
  }, 15000);

  datePicker.addEventListener('change', (e) => {
    if (!liveMode && e.target.value) {
      fetchHistoryData();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
