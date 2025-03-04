document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById('dataChart').getContext('2d');
    let chart;

    // Ensure Chart.js and date adapter are properly included
    import("https://cdn.jsdelivr.net/npm/chart.js");
    import("https://cdn.jsdelivr.net/npm/moment");
    import("https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns");

    // Function to fetch and process CSV files
    async function loadData(file) {
        try {
            console.log(`Loading file: ${file}`); // Debugging output
            const response = await fetch(file);
            if (!response.ok) throw new Error(`Failed to load ${file}`);

            const text = await response.text();
            console.log(`File contents:\n${text.substring(0, 200)}`); // Debugging output

            const rows = text.trim().split("\n");

            // Read metadata: first row = initial timestamp, second row = sample rate
            const startTime = parseInt(rows[0]) * 1000; // Convert UNIX timestamp to milliseconds
            const sampleRate = parseFloat(rows[1]);

            // Set a 3-hour (180 minutes) limit
            const maxTime = startTime + 180 * 60 * 1000; 

            // Process data rows into time-series format within the 3-hour limit
            const data = rows.slice(2).map((val, index) => {
                const timestamp = startTime + index * (1000 / sampleRate);
                if (timestamp > maxTime) return null; // Ignore data beyond 3 hours
                return { x: new Date(timestamp), y: parseFloat(val) };
            }).filter(point => point !== null); // Remove null values

            console.log("Processed Data:", data.slice(0, 5)); // Debugging output
            return data;
        } catch (error) {
            console.error("Error loading data:", error);
            return [];
        }
    }

    // Function to update chart based on selected data
    async function updateChart(selectedData) {
        let file;
        if (selectedData === "temp") file = "TEMP.csv";
        else if (selectedData === "eda") file = "EDA.csv";
        else if (selectedData === "hr") file = "HR.csv";

        const data = await loadData(file);

        // Properly destroy the previous chart before creating a new one
        if (chart) {
            chart.destroy();
            chart = null;
        }

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: selectedData.toUpperCase(),
                    data: data,
                    borderColor: selectedData === "temp" ? "red" : selectedData === "eda" ? "blue" : "green",
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time', // Ensure time scaling works
                        time: { unit: 'minute' },
                        adapters: { date: 'date-fns' }
                    },
                    y: { beginAtZero: false }
                }
            }
        });
    }

    // Event listener for dropdown selection
    document.getElementById('dataSelect').addEventListener('change', function (event) {
        updateChart(event.target.value);
    });

    updateChart("temp"); // Default selection on page load
});


