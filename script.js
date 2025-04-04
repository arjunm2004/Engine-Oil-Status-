// Replace with your ThingSpeak Channel ID and Read API Key
const CHANNEL_ID = 'YOUR_CHANNEL_ID';
const API_KEY = 'YOUR_READ_API_KEY';

// Mapping HTML element IDs to ThingSpeak fields
const fields = {
  oilQuality: 1,     // Field1
  oilPurity: 2,      // Field2
  temperature: 3,    // Field3
  oilLevel: 4        // Field4
};

// Update the status text from ThingSpeak every 15 seconds
function updateStatus() {
  fetch(`https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json?api_key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById('oilQuality').innerText = data[`field${fields.oilQuality}`] + ' (' + mapOilQuality(data[`field${fields.oilQuality}`]) + ')';
      document.getElementById('oilPurity').innerText = data[`field${fields.oilPurity}`] + ' μS/cm';
      document.getElementById('temperature').innerText = data[`field${fields.temperature}`] + ' °C';
      document.getElementById('oilLevel').innerText = mapOilLevel(data[`field${fields.oilLevel}`]);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

// Helper to interpret oil quality
function mapOilQuality(value) {
  const num = parseFloat(value);
  if (num >= 70) return 'Good';
  else if (num >= 40) return 'Moderate';
  else return 'Bad';
}

// Helper to interpret oil level
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
