// main.js - Load and Visualize Physiological Data with 5-Minute Aggregation

document.addEventListener("DOMContentLoaded", function () {
    const ctxTemp = document.getElementById('tempChart').getContext('2d');
    const ctxEda = document.getElementById('edaChart').getContext('2d');
    const ctxHr = document.getElementById('hrChart').getContext('2d');
    let charts = {};
    const gradeBox = document.createElement('div');
    gradeBox.id = 'gradeBox';
    gradeBox.style.position = 'absolute';
    gradeBox.style.top = '10px';
    gradeBox.style.right = '10px';
    gradeBox.style.padding = '10px';
    gradeBox.style.backgroundColor = '#fff';
    gradeBox.style.border = '1px solid #000';
    gradeBox.style.borderRadius = '5px';
    gradeBox.style.fontSize = '16px';
    gradeBox.style.fontWeight = 'bold';
    document.body.appendChild(gradeBox);

    const grades = {
        'Midterm1': { 'S1': 78, 'S2': 82, 'S3': 77, 'S4': 75, 'S5': 67, 'S6': 71, 'S7': 64, 'S8': 92, 'S9': 80, 'S10': 89 },
        'Midterm2': { 'S1': 82, 'S2': 85, 'S3': 90, 'S4': 77, 'S5': 77, 'S6': 64, 'S7': 33, 'S8': 88, 'S9': 39, 'S10': 64 },
        'Final': { 'S1': 182, 'S2': 180, 'S3': 188, 'S4': 149, 'S5': 157, 'S6': 175, 'S7': 110, 'S8': 184, 'S9': 126, 'S10': 116 }
    };

    document.getElementById('studentSelect').addEventListener('change', updateAllCharts);
    document.getElementById('examSelect').addEventListener('change', updateAllCharts);

    async function loadData(student, exam, dataType) {
        try {
            const filePath = `${student}/${exam}/${dataType}.csv`;
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`Failed to load ${filePath}`);

            const text = await response.text();
            const rows = text.trim().split("\n");
            if (rows.length < 3) throw new Error("Invalid file format");

            const startTime = parseInt(rows[0]) * 1000;
            const sampleRate = parseFloat(rows[1]);
            const duration = exam.includes("Final") ? 180 * 60 * 1000 : 90 * 60 * 1000;
            const maxTime = startTime + duration;
            const interval = 5 * 60 * 1000; // 5-minute intervals

            let aggregatedData = [];
            let tempSum = 0, count = 0;
            let currentInterval = startTime;

            rows.slice(2).forEach((val, index) => {
                const timestamp = startTime + index * (1000 / sampleRate);
                if (timestamp > maxTime) return;

                if (timestamp >= currentInterval + interval) {
                    if (count > 0) {
                        aggregatedData.push({ x: new Date(currentInterval), y: tempSum / count });
                    }
                    currentInterval += interval;
                    tempSum = 0;
                    count = 0;
                }
                tempSum += parseFloat(val);
                count++;
            });

            if (count > 0) {
                aggregatedData.push({ x: new Date(currentInterval), y: tempSum / count });
            }

            return aggregatedData;
        } catch (error) {
            console.error("Error loading data:", error);
            return [];
        }
    }

    async function createChart(ctx, label, student, exam, dataType, color) {
        const data = await loadData(student, exam, dataType);

        if (charts[label]) charts[label].destroy();

        
        if (charts[label]) charts[label].destroy();

        const dataset = {
            label: label,
            data: data,
            borderColor: color,
            pointRadius: label === "Electrodermal Activity" ? 4 : 0,
            pointBackgroundColor: label === "Electrodermal Activity" ? "#00ffff" : color,
            pointHoverRadius: label === "Electrodermal Activity" ? 6 : 0,
            borderWidth: label === "Heart Rate" ? 3 : 2,
            tension: label === "Heart Rate" ? 0.1 : 0.4,
            fill: label === "Temperature",
            backgroundColor: function(context) {
                if (label !== "Temperature") return null;
                const chart = context.chart;
                const {ctx, chartArea} = chart;
                if (!chartArea) return null;
                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                gradient.addColorStop(0, 'rgba(30,144,255,0.2)');
                gradient.addColorStop(0.5, 'rgba(255,165,0,0.3)');
                gradient.addColorStop(1, 'rgba(255,0,0,0.4)');
                return gradient;
            }
        };

        charts[label] = new Chart(ctx, {
            type: 'line',
            data: { datasets: [dataset] },
            options: {
                responsive: true,
                scales: {
                    x: { type: 'time', time: { unit: 'minute' } },
                    y: { beginAtZero: false }
                }
            }
        });

        if (label === "Heart Rate" && data.length > 0) {
            const bpm = data[data.length - 1].y;
            const heart = document.getElementById('heartIcon');
            if (heart) {
                const scale = 1 + Math.min((bpm - 60) / 60, 1);
                heart.style.transform = `scale(${scale})`;
                heart.style.transition = 'transform 0.3s ease-in-out';
            }
        }

    }

    function updateGradeBox(student, exam) {
        const grade = grades[exam]?.[student] ?? 'N/A';
        gradeBox.innerHTML = `Grade for ${exam}: ${grade}`;
    }

    async function updateAllCharts() {
        const student = document.getElementById('studentSelect').value;
        const exam = document.getElementById('examSelect').value;
        createChart(ctxTemp, "Temperature", student, exam, "TEMP", "red");
        createChart(ctxEda, "Electrodermal Activity", student, exam, "EDA", "blue");
        createChart(ctxHr, "Heart Rate", student, exam, "HR", "green");
        updateGradeBox(student, exam);
    }

    updateAllCharts();
});




