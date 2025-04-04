document.addEventListener("DOMContentLoaded", function () {
    // 🔧 Define your ThingSpeak Channel ID here
    const channelId = "YOUR_CHANNEL_ID"; // Replace with your channel ID
    const fieldMap = {
        oilQuality: "field1",
        temperature: "field2",
        oilPurity: "field3",
        oilLevel: "field4"
    };

    const apiUrl = `https://api.thingspeak.com/channels/${channelId}/feeds.json?results=1`;

    // Function to toggle graph visibility
    function toggleGraph(event) {
        const dataBox = event.currentTarget;
        const graph = dataBox.querySelector(".graph");

        if (graph.style.display === "block") {
            graph.style.display = "none";
        } else {
            graph.style.display = "block";
        }
    }

    // Attach click event to all data boxes
    document.querySelectorAll(".data-box").forEach(box => {
        box.addEventListener("click", toggleGraph);
    });

    // Function to fetch and update sensor values
    async function fetchSensorData() {
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.feeds.length > 0) {
                const latest = data.feeds[0];

                // Update UI with the latest data
                document.getElementById("oil-quality").innerText = latest[fieldMap.oilQuality] + "%";
                document.getElementById("temperature").innerText = latest[fieldMap.temperature] + "°C";
                document.getElementById("oil-purity").innerText = latest[fieldMap.oilPurity] + "%";
                document.getElementById("oil-level").innerText = latest[fieldMap.oilLevel];
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    // Initial fetch and set interval
    fetchSensorData();
    setInterval(fetchSensorData, 5000); // Update every 5 seconds
});
