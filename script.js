const quizQuestions = [
  "给你一次机会想重来哪个时刻？",
  "你最喜欢我的哪个小优点？",
  "我们有哪些共同喜好？",
  "我们在一起最难忘的瞬间是哪一刻？",
  "如果用三个词语形容我，你会选什么？",
  "如果可以选择你想在哪个时间认识我？",
  "你第一次对我心动是什么时候？",
  "在一起之后你认为我们都改变了什么？ ",
  "最想和我一起完成的一件事是什么？",
  "关于未来你想对我说的话"
];

const prizeItems = [
  { title: "全款承包美味大餐", tip: "幸福开吃",desc:"吃货福利到手，随便点菜我买单！" },
  { title: "谢谢惠顾", tip: "可惜啊可惜",desc:"运气差一点点，下次一定好运爆棚！" },
  { title: "随心愿望兑换券", tip: "愿望实现",desc:"通通满足，我的司机老弟说了算！" },
  { title: "谢谢惠顾", tip: "可惜啊可惜",desc:"运气差一点点，下次一定好运爆棚！" },
  { title: "谢谢惠顾", tip: "可惜啊可惜",desc:"运气差一点点，下次一定好运爆棚！" },
  { title: "吵架免生气豁免卡", tip: "永久有效",desc:"本次矛盾自动清零，给你重新做人的机会。" },
  { title: "浪漫双人约会名额", tip: "约会启动",desc:"专属浪漫已备好，静待和你共度时光。" },
  { title: "神秘隐藏惊喜一份", tip: "等待揭晓",desc:"恭喜解锁彩蛋惊喜，快去揭开谜底吧！" }
];

const fixedDrawSequence = [6,2, 8 ];
const hiddenBonusPrizePosition = 3;
const carouselImages = Array.from({ length: 12 }, (_, index) => `./stastic/${index}.jpg`);

const state = {
  profile: {
    name: ""
  },
  chances: 3,
  isDrawing: false,
  history: [],
  currentStep: "profile",
  drawCount: 0,
  hiddenChanceUnlocked: false,
  carouselIndex: 0,
  carouselTimerId: null
};

const profilePanel = document.getElementById("profile-panel");
const quizPanel = document.getElementById("quiz-panel");
const lotteryPanel = document.getElementById("lottery-panel");
const profileForm = document.getElementById("profile-form");
const quizForm = document.getElementById("quiz-form");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");
const submitAnswersBtn = document.getElementById("submit-answers-btn");
const displayName = document.getElementById("display-name");
const displayBirthday = document.getElementById("display-birthday");
const lotterySummary = document.getElementById("lottery-summary");
const chanceCount = document.getElementById("chance-count");
const lastPrize = document.getElementById("last-prize");
const historyList = document.getElementById("history-list");
const prizePreviewList = document.getElementById("prize-preview-list");
const lotteryStartBtn = document.getElementById("lottery-start-btn");
const unlockHiddenBtn = document.getElementById("unlock-hidden-btn");
const carouselTrack = document.getElementById("carousel-track");
const carouselDots = document.getElementById("carousel-dots");
const carouselCounter = document.getElementById("carousel-counter");
const scoreOverlay = document.getElementById("score-overlay");
const stepChips = document.querySelectorAll("[data-step-chip]");
const lotteryCells = Array.from(document.querySelectorAll(".lottery-cell")).sort((a, b) => {
  return Number(a.dataset.cellIndex) - Number(b.dataset.cellIndex);
});

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function renderQuiz() {
  quizForm.innerHTML = quizQuestions
    .map((question, index) => {
      return `
        <div class="quiz-item">
          <label for="quiz-answer-${index}">${index + 1}. ${question}</label>
          <input
            id="quiz-answer-${index}"
            data-question-index="${index}"
            type="text"
            maxlength="80"
            placeholder="请输入你的答案"
          >
        </div>
      `;
    })
    .join("");
}

function renderPrizes() {
  prizePreviewList.innerHTML = prizeItems
    .map((item) => `<span class="preview-pill">${item.title}</span>`)
    .join("");

  lotteryCells.forEach((cell) => {
    const boardPosition = Number(cell.dataset.cellIndex);
    const item = prizeItems[boardPosition - 1];
    cell.innerHTML = `<span>${item.title}</span><small>${item.tip}</small>`;
  });
}

function renderCarousel() {
  carouselTrack.innerHTML = carouselImages
    .map((src, index) => {
      return `
        <div class="carousel-slide">
          <img src="${src}" alt="专属照片 ${index + 1}" loading="${index === 0 ? "eager" : "lazy"}">
        </div>
      `;
    })
    .join("");

  carouselDots.innerHTML = carouselImages
    .map((_, index) => `<button class="carousel-dot${index === 0 ? " is-active" : ""}" type="button" data-carousel-dot="${index}" aria-label="查看第 ${index + 1} 张"></button>`)
    .join("");

  updateCarousel();
}

function updateCarousel() {
  carouselTrack.style.transform = `translateX(-${state.carouselIndex * 100}%)`;
  carouselCounter.textContent = `${state.carouselIndex + 1} / ${carouselImages.length}`;

  carouselDots.querySelectorAll("[data-carousel-dot]").forEach((dot) => {
    const dotIndex = Number(dot.dataset.carouselDot);
    dot.classList.toggle("is-active", dotIndex === state.carouselIndex);
  });
}

function goToCarousel(index) {
  state.carouselIndex = index;
  updateCarousel();
}

function startCarouselAutoPlay() {
  if (state.carouselTimerId) {
    window.clearInterval(state.carouselTimerId);
  }

  state.carouselTimerId = window.setInterval(() => {
    const nextIndex = (state.carouselIndex + 1) % carouselImages.length;
    goToCarousel(nextIndex);
  }, 2400);
}

async function playScoreAnimation() {
  scoreOverlay.classList.add("is-visible");
  await waitForFinalPaint();
  await sleep(1800);
  scoreOverlay.classList.remove("is-visible");
  await sleep(220);
}

function setStep(step) {
  state.currentStep = step;

  profilePanel.classList.toggle("is-visible", step === "profile");
  quizPanel.classList.toggle("is-visible", step === "quiz");
  lotteryPanel.classList.toggle("is-visible", step === "lottery");

  stepChips.forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.stepChip === step);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateQuizProgress() {
  const inputs = Array.from(quizForm.querySelectorAll("input"));
  const filledCount = inputs.filter((input) => input.value.trim()).length;
  const percent = (filledCount / quizQuestions.length) * 100;

  progressText.textContent = `${filledCount} / ${quizQuestions.length}`;
  progressFill.style.width = `${percent}%`;
}

function updateBirthdayCard() {
  displayName.textContent = state.profile.name || "寿星";
  displayBirthday.textContent = "专属惊喜已准备好";
  lotterySummary.textContent = `${state.profile.name || "寿星"} 已完成答题，下面开始抽取生日惊喜。`;
}

function updateLotteryStatus() {
  chanceCount.textContent = `${state.chances} 次`;
  lotteryStartBtn.disabled = state.chances === 0 || state.isDrawing;

  const showUnlockButton = state.chances === 0 && state.drawCount >= fixedDrawSequence.length && !state.hiddenChanceUnlocked;
  unlockHiddenBtn.classList.toggle("is-hidden", !showUnlockButton);
  unlockHiddenBtn.disabled = state.isDrawing || state.hiddenChanceUnlocked;

  if (state.chances === 0) {
    lotteryStartBtn.textContent = "抽奖已结束";
  } else if (state.isDrawing) {
    lotteryStartBtn.textContent = "抽奖中...";
  } else {
    lotteryStartBtn.textContent = "开始抽奖";
  }

  if (state.hiddenChanceUnlocked) {
    unlockHiddenBtn.textContent = "隐藏抽奖次数已解锁";
  } else {
    unlockHiddenBtn.textContent = "联系马英飞解锁隐藏抽奖次数";
  }
}

function renderHistory() {
  if (!state.history.length) {
    historyList.innerHTML = "<li>还没有抽奖记录</li>";
    return;
  }

  historyList.innerHTML = state.history
    .map((item, index) => `<li>第 ${index + 1} 次：抽中了 ${item.title}（${item.tip}）</li>`)
    .join("");
}

function validateProfile() {
  const name = document.getElementById("friend-name").value.trim();

  if (!name) {
    window.alert("请先填写名字。");
    return false;
  }

  state.profile.name = name;
  return true;
}

function validateAnswers() {
  const answers = Array.from(quizForm.querySelectorAll("input")).map((input) => input.value.trim());
  const hasEmptyAnswer = answers.some((answer) => !answer);

  if (hasEmptyAnswer) {
    window.alert("10 道题都要填写完成才能进入抽奖。");
    return false;
  }

  return true;
}

function clearActiveCell() {
  lotteryCells.forEach((cell) => cell.classList.remove("is-active"));
}

function getFixedPrizePosition() {
  if (state.drawCount < fixedDrawSequence.length) {
    return fixedDrawSequence[state.drawCount];
  }

  if (state.hiddenChanceUnlocked && state.drawCount === fixedDrawSequence.length) {
    return hiddenBonusPrizePosition;
  }

  return fixedDrawSequence[fixedDrawSequence.length - 1];
}

function runLotteryAnimation(targetPosition) {
  return new Promise((resolve) => {
    let currentIndex = -1;
    let stepCount = 0;
    const targetArrayIndex = targetPosition - 1;
    // currentIndex starts at -1, so landing on the target board position needs one extra step.
    const totalSteps = 24 + targetArrayIndex + 1;
    let speed = 120;

    function tick() {
      clearActiveCell();
      currentIndex = (currentIndex + 1) % lotteryCells.length;
      lotteryCells[currentIndex].classList.add("is-active");
      stepCount += 1;

      if (stepCount >= totalSteps) {
        resolve();
        return;
      }

      if (stepCount > totalSteps - 8) {
        speed += 45;
      } else if (stepCount < 6 && speed > 70) {
        speed -= 10;
      }

      window.setTimeout(tick, speed);
    }

    tick();
  });
}

function waitForFinalPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

async function handleLottery() {
  if (state.isDrawing || state.chances === 0) {
    return;
  }

  state.isDrawing = true;
  updateLotteryStatus();

  const targetPosition = getFixedPrizePosition();
  const prize = prizeItems[targetPosition - 1];

  await runLotteryAnimation(targetPosition);

  state.chances -= 1;
  state.isDrawing = false;
  state.drawCount += 1;
  state.history.push(prize);
  lastPrize.textContent = prize.title;

  renderHistory();
  updateLotteryStatus();
  await waitForFinalPaint();

  window.alert(`恭喜 ${state.profile.name || "你"}，抽中了：${prize.title}！\n${prize.desc || prize.tip}`);
}

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateProfile()) {
    return;
  }

  updateBirthdayCard();
  document.getElementById("quiz-intro").textContent = `${state.profile.name}，下面是专属你的 10 道题。`;
  setStep("quiz");
});

quizForm.addEventListener("input", updateQuizProgress);

submitAnswersBtn.addEventListener("click", () => {
  if (!validateAnswers()) {
    return;
  }

  (async () => {
    submitAnswersBtn.disabled = true;
    updateBirthdayCard();
    await playScoreAnimation();
    setStep("lottery");
    submitAnswersBtn.disabled = false;
  })();
});

lotteryStartBtn.addEventListener("click", handleLottery);

unlockHiddenBtn.addEventListener("click", () => {
  if (state.hiddenChanceUnlocked) {
    return;
  }

  const password = window.prompt("请输入解锁密码");
  if (password !== "我是雷锋") {
    window.alert("密码不正确，无法解锁隐藏抽奖次数。");
    return;
  }

  state.hiddenChanceUnlocked = true;
  state.chances += 1;
  lotterySummary.textContent = "隐藏抽奖次数已解锁，这一次固定送你随心愿望兑换券。";
  updateLotteryStatus();
  window.alert("已联系马英飞，隐藏抽奖次数 +1，下一抽固定中奖：随心愿望兑换券！");
});

renderQuiz();
renderPrizes();
renderCarousel();
updateQuizProgress();
updateBirthdayCard();
updateLotteryStatus();
renderHistory();
startCarouselAutoPlay();

carouselDots.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.dataset.carouselDot) {
    return;
  }

  goToCarousel(Number(target.dataset.carouselDot));
  startCarouselAutoPlay();
});
