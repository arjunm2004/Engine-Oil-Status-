// Replace with your ThingSpeak Channel ID and Read API Key
const CHANNEL_ID = '2901954';
const API_KEY = 'Z4VBUE2OIARQXHEV';

// Mapping HTML element IDs to ThingSpeak fields
const fields = {
  oilQuality: 1,    
  oilPurity: 2,     
  temperature: 3,   
  oilLevel: 4       
};

// Update the status text from ThingSpeak every 15 seconds
function updateStatus() {
  fetch(`https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json?api_key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById('value-oil-quality').innerText = data[`field${fields.oilQuality}`];
      document.getElementById('status-oil-quality').innerText = mapOilQuality(data[`field${fields.oilQuality}`]);

      document.getElementById('value-oil-purity').innerText = data[`field${fields.oilPurity}`] + ' μS/cm';
      document.getElementById('status-oil-purity').innerText = mapOilPurity(data[`field${fields.oilPurity}`]);

      document.getElementById('value-temperature').innerText = data[`field${fields.temperature}`] + ' °C';
      document.getElementById('status-temperature').innerText = mapTemperature(data[`field${fields.temperature}`]);

      document.getElementById('value-oil-level').innerText = data[`field${fields.oilLevel}`];
      document.getElementById('status-oil-level').innerText = mapOilLevel(data[`field${fields.oilLevel}`]);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

// Helper functions to interpret status messages
function mapOilQuality(value) {
  const num = parseFloat(value);
  if (num >= 80) return 'Good';
  else if (num >= 40) return 'Moderate';
  else return 'Bad';
}

function mapOilPurity(value) {
  const num = parseFloat(value);
  if (num >= 80) return 'Good';
  else if (num >= 50) return 'Moderate';
  else return 'Bad';
}

function mapTemperature(value) {
  const num = parseFloat(value);
  if (num <= 80) return 'Normal';
  else return 'Overheat';
}

function mapOilLevel(value) {
  const num = parseFloat(value);
  return num < 1 ? 'Low' : 'Good';
}

// Toggle the ThingSpeak graph iframe
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

// Initial update
updateStatus();

// Repeat update every 15 seconds
setInterval(updateStatus, 15000);
