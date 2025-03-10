document.addEventListener("DOMContentLoaded", function () {
  const heartIcon = document.getElementById('heartIcon');
  const heartValue = document.getElementById('heartValue');
  const thermoFill = document.getElementById('thermoFill');
  const timeSlider = document.getElementById('timeSlider');
  const timeLabel = document.getElementById('timeLabel');
  const ctxEda = document.getElementById('edaChart').getContext('2d');
  const studentSelect = document.getElementById('studentSelect');
  const examSelect = document.getElementById('examSelect');

  let charts = {};
  let edaData = [], hrData = [], tempData = [];

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

  function computeStats(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const mean = (data.reduce((a, b) => a + b, 0) / data.length).toFixed(2);
    const max = Math.max(...data).toFixed(2);
    const min = Math.min(...data).toFixed(2);
    const mid = Math.floor(data.length / 2);
    const median = (data.length % 2 === 0)
      ? ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2)
      : sorted[mid].toFixed(2);
    return { mean, max, min, median };
  }

  function updateStatsBox(id, data) {
    const stats = computeStats(data);
    document.getElementById(id).innerHTML = `
      <strong>Mean:</strong> ${stats.mean}<br/>
      <strong>Max:</strong> ${stats.max}<br/>
      <strong>Min:</strong> ${stats.min}<br/>
      <strong>Median:</strong> ${stats.median}
    `;
  }

  function getTimeFromSlider(value) {
    const start = new Date();
    start.setHours(9, 0, 0, 0);
    return new Date(start.getTime() + value * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function updateGradeBox(student, exam) {
    const grade = grades[exam]?.[student] ?? 'N/A';
    gradeBox.innerHTML = `Grade for ${exam}: ${grade}`;
  }

  async function loadData(student, exam, type) {
    const path = `${student}/${exam}/${type}.csv`;
    const response = await fetch(path);
    const text = await response.text();
    const lines = text.trim().split('\n');
    const startTime = parseInt(lines[0]) * 1000;
    const sampleRate = parseFloat(lines[1]);
    const values = lines.slice(2).map(Number);

    const duration = exam === 'Final' ? 180 * 60 * 1000 : 90 * 60 * 1000;
    const maxTime = startTime + duration;
    const interval = 60 * 1000; // 1-minute buckets

    let aggregated = [];
    let sum = 0, count = 0, bucketStart = startTime;

    for (let i = 0; i < values.length; i++) {
      const timestamp = startTime + i * (1000 / sampleRate);
      if (timestamp > maxTime) break;

      if (timestamp >= bucketStart + interval) {
        aggregated.push(sum / count);
        sum = 0;
        count = 0;
        bucketStart += interval;
      }

      sum += values[i];
      count++;
    }

    if (count > 0) {
      aggregated.push(sum / count);
    }

    return aggregated;
  }

  function renderLineTrend(canvasId, label, data, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const ctxTempTrend = document.getElementById('tempTrend').getContext('2d');
const ctxEdaTrend = document.getElementById('edaTrend').getContext('2d');
const ctxHrTrend = document.getElementById('hrTrend').getContext('2d');

if (charts[canvasId]) charts[canvasId].destroy();

const start = new Date();
start.setHours(9, 0, 0, 0);
const labels = data.map((_, i) =>
new Date(start.getTime() + i * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
);

charts[canvasId] = new Chart(ctx, {
type: 'line',
data: {
  labels: labels,
  datasets: [{
    label: label,
    data: data,
    borderColor: color,
    backgroundColor: 'transparent',
    tension: 0.3
  }]
},
options: {
  responsive: true,
  animation: false,
  scales: {
    x: {
      title: { display: true, text: 'Time' },
      ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
    },
    y: { beginAtZero: false }
  }
}
});
}

  async function updateCharts() {
    const i = parseInt(timeSlider.value);
    const student = studentSelect.value;
    const exam = examSelect.value;

    timeLabel.textContent = "Time: " + getTimeFromSlider(i);
    updateGradeBox(student, exam);

    [edaData, hrData, tempData] = await Promise.all([
      loadData(student, exam, 'EDA'),
      loadData(student, exam, 'HR'),
      loadData(student, exam, 'TEMP')
    ]);

    const temp = tempData[i];
    thermoFill.style.height = Math.min(Math.max((temp - 22) / 10 * 100, 0), 100) + '%';
    document.getElementById('tempTooltip').textContent = `${temp.toFixed(2)} °C`;

    const hr = hrData[i];
    const scale = 1 + Math.min((hr - 60) / 60, 1);
    heartIcon.style.transform = `scale(${scale})`;
    heartValue.textContent = `${Math.round(hr)} BPM`;

    if (charts.eda) charts.eda.destroy();
    charts.eda = new Chart(ctxEda, {
      type: 'bar',
      data: {
        labels: ['EDA'],
        datasets: [{
          label: 'μS',
          data: [edaData[i]],
          backgroundColor: 'cyan',
          borderColor: '#00ffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 2 }
        },
        animation: { duration: 0 }
      }
    });

    // Render trends and update stats
    renderLineTrend("tempTrend", "Temperature", tempData.slice(0, i + 1), "red", exam);
renderLineTrend("edaTrend", "EDA", edaData.slice(0, i + 1), "blue", exam);
renderLineTrend("hrTrend", "Heart Rate", hrData.slice(0, i + 1), "green", exam);


    updateStatsBox('tempStats', tempData.slice(0, i + 1));
    updateStatsBox('hrStats', hrData.slice(0, i + 1));
    updateStatsBox('edaStats', edaData.slice(0, i + 1));
  }

  function adjustSliderRange() {
    const exam = examSelect.value;
    const maxTime = exam === 'Final' ? 180 : 90;
    timeSlider.max = maxTime.toString();
    if (parseInt(timeSlider.value) > maxTime) {
      timeSlider.value = maxTime.toString();
    }
    updateCharts();
  }

  studentSelect.addEventListener('change', updateCharts);
  examSelect.addEventListener('change', adjustSliderRange);
  timeSlider.addEventListener('input', updateCharts);

  adjustSliderRange();
});
  
  