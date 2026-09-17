// Cooking mode logic for the recipe card.
// This keeps the main recipe layout intact while adding a guided kitchen workflow.

const cookingSteps = [
  "Bring a large pot of salted water to a boil and cook the pasta until al dente. Reserve 1/2 cup of pasta water, then drain.",
  "While the pasta cooks, warm olive oil in a large skillet over medium heat. Add garlic and cook for 30 seconds until fragrant.",
  "Stir in the cherry tomatoes, zucchini, and peas. Cook for 4–5 minutes until the vegetables soften and the tomatoes begin to burst.",
  "Add the spinach and basil, then toss in the drained pasta. Pour in a splash of the reserved pasta water to create a glossy sauce.",
  "Season with salt, pepper, and chili flakes. Finish with parmesan and toss gently until everything is evenly coated.",
  "Serve immediately with extra herbs and a little more parmesan on top for a fresh, vibrant finish."
];

const stepDurations = [0, 30, 300, 0, 0, 0];

const overlay = document.getElementById("cookingOverlay");
const stepIndicator = document.getElementById("cookingStepIndicator");
const stepHeading = document.getElementById("cookingStepHeading");
const stepText = document.getElementById("cookingStepText");
const progressFill = document.getElementById("progressFill");
const timerDisplay = document.getElementById("timerDisplay");
const startTimerBtn = document.getElementById("startTimerBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");
const prevStepBtn = document.getElementById("prevStepBtn");
const nextStepBtn = document.getElementById("nextStepBtn");
const closeCookingBtn = document.querySelector(".close-cooking");
const startCookingButton = document.getElementById("startCookingMode");

let currentStep = 0;
let timerSeconds = 0;
let timerInterval = null;
let timerActive = false;
let alarmAudio = null;

function parseDurationFromText(stepTextValue) {
  const match = stepTextValue.match(/(\d+)\s*(?:-|to\s+)?\s*(\d+)?\s*(seconds?|minutes?|mins?|sec|min)/i);

  if (!match) {
    return 0;
  }

  const first = Number(match[1]);
  const second = match[2] ? Number(match[2]) : 0;
  const unit = (match[3] || "").toLowerCase();

  if (unit.startsWith("sec")) {
    return second > 0 ? first + second : first;
  }

  if (unit.startsWith("min")) {
    const totalSeconds = second > 0 ? (first * 60) + (second * 60) : first * 60;
    return totalSeconds;
  }

  return 0;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerActive = false;
  startTimerBtn.textContent = "Start Timer";
}

function triggerAlarm() {
  stopTimer();

  timerDisplay.classList.add("timer-warning");

  if (!alarmAudio) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      alarmAudio = new AudioContextClass();
    }
  }

  if (alarmAudio) {
    const oscillator = alarmAudio.createOscillator();
    const gainNode = alarmAudio.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.2;
    oscillator.connect(gainNode);
    gainNode.connect(alarmAudio.destination);
    oscillator.start();
    oscillator.stop(alarmAudio.currentTime + 0.5);
  }

  startTimerBtn.textContent = "Timer Complete";
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timerSeconds);
}

function createTimerForCurrentStep() {
  stopTimer();
  timerDisplay.classList.remove("timer-warning");

  const currentText = cookingSteps[currentStep];
  const parsedDuration = parseDurationFromText(currentText) || stepDurations[currentStep] || 0;

  if (parsedDuration > 0) {
    timerSeconds = parsedDuration;
  } else {
    timerSeconds = 0;
  }

  updateTimerDisplay();
}

function updateStepView() {
  const totalSteps = cookingSteps.length;
  const safeIndex = Math.min(Math.max(currentStep, 0), totalSteps - 1);

  stepIndicator.textContent = `Step ${safeIndex + 1} of ${totalSteps}`;
  stepHeading.textContent = `Step ${safeIndex + 1}`;
  stepText.textContent = cookingSteps[safeIndex];
  progressFill.style.width = `${((safeIndex + 1) / totalSteps) * 100}%`;

  prevStepBtn.disabled = safeIndex === 0;
  prevStepBtn.style.opacity = safeIndex === 0 ? "0.5" : "1";

  if (safeIndex === totalSteps - 1) {
    nextStepBtn.textContent = "Finish";
  } else {
    nextStepBtn.textContent = "Next";
  }

  createTimerForCurrentStep();
}

function openCookingMode() {
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updateStepView();
}

function closeCookingMode() {
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  stopTimer();
}

startCookingButton.addEventListener("click", openCookingMode);
closeCookingBtn.addEventListener("click", closeCookingMode);

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    closeCookingMode();
  }
});

prevStepBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep -= 1;
    updateStepView();
  }
});

nextStepBtn.addEventListener("click", () => {
  if (currentStep < cookingSteps.length - 1) {
    currentStep += 1;
    updateStepView();
    return;
  }

  closeCookingMode();
});

startTimerBtn.addEventListener("click", () => {
  const activeDuration = parseDurationFromText(cookingSteps[currentStep]) || stepDurations[currentStep] || 0;

  if (activeDuration <= 0) {
    timerDisplay.textContent = "No timer";
    return;
  }

  if (timerActive) {
    stopTimer();
    return;
  }

  timerActive = true;
  startTimerBtn.textContent = "Pause Timer";

  timerInterval = setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds -= 1;
      updateTimerDisplay();
      return;
    }

    triggerAlarm();
  }, 1000);
});

resetTimerBtn.addEventListener("click", () => {
  stopTimer();
  timerDisplay.classList.remove("timer-warning");

  const activeDuration = parseDurationFromText(cookingSteps[currentStep]) || stepDurations[currentStep] || 0;
  timerSeconds = activeDuration;
  updateTimerDisplay();
});

document.addEventListener("keydown", (event) => {
  if (overlay.classList.contains("is-open") && event.key === "Escape") {
    closeCookingMode();
  }
});

updateStepView();
