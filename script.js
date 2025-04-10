const CHANNEL_ID = '2901954';
const API_KEY = 'Z4VBUE2OIARQXHEV';

const fields = {
  oilQuality: 1,
  oilPurity: 2,
  temperature: 3,
  oilLevel: 4
};

let liveMode = true;

function updateStatus() {
  if (!liveMode) return;

  fetch(`https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json?api_key=${API_KEY}`)
    .then(response => response.json())
    .then(data => updateUI(data))
    .catch(error => console.error('Error fetching data:', error));
}

function updateUI(data) {
  document.getElementById('value-oil-quality').innerText = data[`field${fields.oilQuality}`];
  document.getElementById('status-oil-quality').innerText = mapOilQuality(data[`field${fields.oilQuality}`]);

  document.getElementById('value-oil-purity').innerText = data[`field${fields.oilPurity}`] + ' μS/cm';
  document.getElementById('status-oil-purity').innerText = mapOilPurity(data[`field${fields.oilPurity}`]);

  document.getElementById('value-temperature').innerText = data[`field${fields.temperature}`] + ' °C';
  document.getElementById('status-temperature').innerText = mapTemperature(data[`field${fields.temperature}`]);

  document.getElementById('value-oil-level').innerText = data[`field${fields.oilLevel}`];
  document.getElementById('status-oil-level').innerText = mapOilLevel(data[`field${fields.oilLevel}`]);
}

function toggleGraph(id, fieldNum) {
  const graph = document.getElementById(id);
  if (graph.style.display === 'none' || graph.style.display === '') {
    graph.style.display = 'block';
    graph.innerHTML = `
      <iframe width="100%" height="260" style="border:1px solid #ccc"
        src="https://thingspeak.com/channels/${CHANNEL_ID}/charts/${fieldNum}?bgcolor=%23ffffff&color=%23d62020&dynamic=true&type=line&results=60">
      </iframe>`;
  } else {
    graph.style.display = 'none';
    graph.innerHTML = '';
  }
}

// Mapping helpers
function mapOilQuality(val) {
  const num = parseFloat(val);
  return num >= 80 ? 'Good' : num >= 40 ? 'Moderate' : 'Bad';
}

function mapOilPurity(val) {
  const num = parseFloat(val);
  return num >= 80 ? 'Good' : num >= 50 ? 'Moderate' : 'Bad';
}

function mapTemperature(val) {
  const num = parseFloat(val);
  return num <= 80 ? 'Normal' : 'Overheat';
}

function mapOilLevel(val) {
  return parseFloat(val) < 1 ? 'Low' : 'Good';
}

// Toggle live/history mode
function toggleMode() {
  liveMode = document.getElementById('mode-toggle').checked;
  document.getElementById('mode-label').innerText = liveMode ? 'Live' : 'History';

  if (liveMode) {
    updateStatus();
  } else {
    const selectedDate = document.getElementById('date-picker').value;
    if (selectedDate) {
      fetchHistoryData(selectedDate);
    }
  }
}

// Fetch historical data by date
function fetchHistoryData(dateStr) {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59);

  const startISO = start.toISOString();
  const endISO = end.toISOString();

  const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${API_KEY}&start=${startISO}&end=${endISO}&limit=1`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.feeds && data.feeds.length > 0) {
        updateUI(data.feeds[0]);
      } else {
        alert("No data found for selected date.");
      }
    })
    .catch(error => console.error('Error fetching historical data:', error));
}

// Display real-time date at top
function displayCurrentDate() {
  const now = new Date();
  const formatted = now.toLocaleDateString('en-GB');
  document.getElementById('current-date').innerText = formatted;
}

// Listen to date picker change
document.addEventListener('DOMContentLoaded', () => {
  displayCurrentDate();
  updateStatus();
  setInterval(() => {
    displayCurrentDate();
    updateStatus();
  }, 5000);

  document.getElementById('date-picker').addEventListener('change', () => {
    if (!liveMode) {
      const selectedDate = document.getElementById('date-picker').value;
      if (selectedDate) fetchHistoryData(selectedDate);
    }
  });
});
