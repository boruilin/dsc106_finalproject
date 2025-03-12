document.addEventListener("DOMContentLoaded", function () {
    // Scroll fade in logic
    const steps = document.querySelectorAll('.scroll-step');
    window.addEventListener('scroll', () => {
      const trigger = window.innerHeight * 0.7;
      steps.forEach(step => {
        const top = step.getBoundingClientRect().top;
        step.classList.toggle('active', top < trigger);
      });
    });
  
    // Fake animation for heart rate icon
    const heartIcon = document.getElementById("heartIcon");
    const heartValue = document.getElementById("heartValue");
    let pulse = 75;
    setInterval(() => {
      pulse += (Math.random() - 0.5) * 2;
      heartIcon.style.transform = `scale(${1 + (pulse - 60) / 100})`;
      heartValue.textContent = `${Math.round(pulse)} BPM`;
    }, 800);
  
    // Fake animation for temperature
    const thermoFill = document.getElementById("thermoFill");
    const tempTooltip = document.getElementById("tempTooltip");
    let temp = 36.5;
    setInterval(() => {
      temp += (Math.random() - 0.5) * 0.2;
      const height = Math.min(Math.max((temp - 35) * 50, 0), 100);
      thermoFill.style.height = `${height}%`;
      tempTooltip.textContent = `${temp.toFixed(2)} °C`;
    }, 1500);
  
    // Simple prediction logic
    document.getElementById("predict-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const hr = parseFloat(document.getElementById("hr").value);
      const eda = parseFloat(document.getElementById("eda").value);
      const temp = parseFloat(document.getElementById("temp").value);
      const score = ((hr - 60) * 0.4 + eda * 0.5 + (temp - 36.5) * 10).toFixed(1);
      document.getElementById("result").textContent = `Predicted Stress Score: ${score}`;
    });
  });
  