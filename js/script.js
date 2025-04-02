const loginContainer = document.querySelector(".login"),
  loginBack = loginContainer.querySelector(".back"),
  usernameForm = document.querySelector(".login-form"),
  usernameInput = document.getElementById("username"),
  usernameMinEl = document.querySelector(".username-min"),
  usernameMin = 3,
  usernameMaxEl = document.querySelector(".username-max"),
  usernameMax = 10,
  usernameSubmit = usernameForm.querySelector("input[type=submit]"),
  usernameRegex = /^[a-zA-Z0-9]{3,10}$/,
  guestModeBtn = document.querySelector(".guest-mode"),
  nameEl = document.querySelector(".user .name"),
  changeUserBtn = document.querySelector(".user .change-user"),
  blocksContainer = document.querySelector(".blocks-container"),
  blocks = Array.from(blocksContainer.querySelectorAll(".block")),
  randomRange = Array.from(Array(blocks.length).keys()),
  timerEl = document.querySelector(".timer"),
  timerValue = document.querySelector(".timer .value"),
  restartEl = document.querySelector(".restart"),
  defaultDuration = 1000,
  defaultTimer = 40,
  triesEl = document.querySelector(".tries .value"),
  winsEl = document.querySelector(".wins .value"),
  losesEl = document.querySelector(".loses .value"),
  messagesEl = document.querySelector(".messages "),
  messagesContainer = document.querySelector(".messages .container"),
  rankBtn = document.querySelector(".user .rank"),
  rankContainer = document.querySelector(".rank-container"),
  rankContainerClose = rankContainer.querySelector(".close"),
  rankUsersContainer = rankContainer.querySelector(".rank-users");

let users = {},
  user = {},
  firstClick = true,
  timerInterval,
  flipTimeout,
  timer = defaultTimer,
  tries = 0,
  wins = 0,
  winRate = 0,
  loses = 0;

if (localStorage.getItem("memory-blocks-users")) {
  users = JSON.parse(localStorage.getItem("memory-blocks-users"));
  if (localStorage.getItem("memory-blocks-username")) {
    user = users[localStorage.getItem("memory-blocks-username")];
    getData();
    showData();
  }
} else {
  loginContainer.classList.add("active");
}

usernameMinEl.textContent = usernameMin;
usernameMaxEl.textContent = usernameMax;
usernameInput.setAttribute("maxlength", usernameMax);

shuffleBlocks();

timerValue.textContent = timer;

loginBack.addEventListener("click", () => {
  loginContainer.classList.remove("active");
});

guestModeBtn.addEventListener("click", () => {
  if (localStorage.getItem("memory-blocks-username")) {
    localStorage.removeItem("memory-blocks-username");
    location.reload();
  } else {
    loginContainer.classList.remove("active");
  }
});

usernameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (checkUsername()) {
    submit(usernameInput.value);
  }
});

usernameInput.addEventListener("input", () => {
  if (checkUsername()) {
    usernameSubmit.disabled = false;
  } else {
    usernameSubmit.disabled = true;
  }
});

changeUserBtn.addEventListener("click", () => {
  loginBack.classList.add("active");
  loginContainer.classList.add("active");
});

blocks.forEach((block) => {
  block.addEventListener("click", () => {
    if (firstClick) {
      startTimer();
      firstClick = false;
    }
    block.classList.add("flip");
    const flippedEls = blocks.filter((block) => block.classList.contains("flip"));
    if (flippedEls.length == 2) checkFlipped(flippedEls);
  });
});

restartEl.addEventListener("click", () => {
  restartEl.classList.remove("active");
  resetGame();
});

rankBtn.addEventListener("click", () => {
  rankContainer.classList.add("active");
  if (localStorage.getItem("memory-blocks-users")) showRank();
});

rankContainerClose.addEventListener("click", () => {
  rankContainer.classList.remove("active");
});

function checkUsername() {
  if (usernameRegex.test(usernameInput.value)) {
    return true;
  } else {
    return false;
  }
}

function submit(username) {
  if (username === user.username) {
    loginContainer.classList.remove("active");
  } else {
    if (!users[username]) {
      users[username] = {
        username: username,
        tries: 0,
        wins: 0,
        winRate: 0,
        loses: 0,
      };
      saveData();
    }
    user = users[username];
    localStorage.setItem("memory-blocks-username", user.username);
    location.reload();
  }
}

function saveData() {
  const usersObj = JSON.stringify(users);
  localStorage.setItem("memory-blocks-users", usersObj);
}

function getData() {
  tries = user.tries;
  wins = user.wins;
  winRate = user.winRate;
  loses = user.loses;
}

function showData() {
  nameEl.textContent = user.username;
  triesEl.textContent = formatNumber(user.tries);
  winsEl.textContent = formatNumber(user.wins);
  losesEl.textContent = formatNumber(user.loses);
}

function updateUserDate() {
  if (localStorage.getItem("memory-blocks-username")) {
    user.tries = tries;
    user.wins = wins;
    user.winRate = winRate;
    user.loses = loses;
    users[user.username] = user;
    saveData();
  }
}

function shuffleArray(array) {
  let currentIndex = array.length;
  while (currentIndex > 0) {
    const random = Math.floor(Math.random() * array.length);
    currentIndex--;
    [array[currentIndex], array[random]] = [array[random], array[currentIndex]];
  }
  return array;
}

function shuffleBlocks() {
  shuffleArray(randomRange);
  blocks.forEach((block, index) => {
    block.style.order = randomRange[index];
  });
}

function checkFlipped(flippedEls) {
  blocksContainer.classList.add("disable-click");
  const check = flippedEls[0].dataset.value == flippedEls[1].dataset.value;
  if (check) {
    flippedEls.forEach((el) => {
      el.classList.remove("flip");
      el.classList.add("match");
    });
    blocksContainer.classList.remove("disable-click");
  } else {
    flipTimeout = setTimeout(() => {
      flippedEls.forEach((el) => el.classList.remove("flip"));
      blocksContainer.classList.remove("disable-click");
    }, defaultDuration);
  }
  const matchedEls = blocks.filter((block) => block.classList.contains("match"));
  if (matchedEls.length == blocks.length) {
    stopTimer();
    win();
  }
}

function resetGame() {
  firstClick = true;
  removeChildren(messagesContainer);
  blocks.forEach((block) => {
    block.classList.remove("flip", "match");
  });
  setTimeout(() => {
    shuffleBlocks();
    blocksContainer.classList.remove("end");
    timer = defaultTimer;
    timerValue.textContent = timer;
    timerEl.classList.add("active");
  }, 300);
}

function startTimer() {
  window.removeEventListener("beforeunload", lose);
  window.addEventListener("beforeunload", lose);
  timerInterval = setInterval(() => {
    updateTimer();
    if (timer == 0) {
      stopTimer();
      lose();
    }
  }, 1000);
}

function stopTimer() {
  window.removeEventListener("beforeunload", lose);
  clearInterval(timerInterval);
}

function updateTimer() {
  timer--;
  if (timer < 10) {
    timerValue.textContent = `0${timer}`;
  } else {
    timerValue.textContent = timer;
  }
}

function win() {
  blocksContainer.classList.add("end");
  tries++;
  triesEl.textContent = tries;
  wins++;
  winsEl.textContent = wins;
  winRate = (wins / tries) * 100;
  updateUserDate();
  timerEl.classList.remove("active");
  restartEl.classList.add("active");
  createMessage("win", "Great Work!", "Play a lot to reach the top of the leaderboard and defeat other users on this device.");
}

function lose() {
  blocksContainer.classList.add("end");
  tries++;
  triesEl.textContent = tries;
  loses++;
  losesEl.textContent = loses;
  winRate = (wins / tries) * 100;
  updateUserDate();
  timerEl.classList.remove("active");
  restartEl.classList.add("active");
  createMessage("lose", "Game Over", "But no worries. Try again and never give up.");
}

function createMessage(type, title, message) {
  removeChildren(messagesContainer);
  messagesEl.classList.remove("win", "lose");
  messagesEl.classList.add(type);

  const titleEl = document.createElement("h2");
  titleEl.classList.add("title");
  const titleText = document.createTextNode(title);
  titleEl.appendChild(titleText);

  const messageEl = document.createElement("p");
  messageEl.classList.add("message");
  const messageText = document.createTextNode(message);
  messageEl.appendChild(messageText);

  messagesContainer.append(titleEl, messageEl);
}

function rankUsers(usersObject) {
  const object = JSON.parse(usersObject);
  const values = Object.values(object);
  values.sort((userA, userB) => {
    if (userA.wins !== userB.wins) return userB.wins - userA.wins;
    if (userA.loses !== userB.loses) return userA.loses - userB.loses;
    if (userA.winRate !== userB.winRate) return userB.winRate - userA.winRate;
    return userB.tries - userA.tries;
  });
  const rankArray = [];
  values.forEach((el) => {
    rankArray.push(el);
  });
  return rankArray;
}

function showRank() {
  removeChildren(rankUsersContainer);
  const users = rankUsers(localStorage.getItem("memory-blocks-users"));
  appendRank(false, true);
  users.forEach((user, index) => {
    appendRank(user, false, index);
  });
}

function appendRank(user, isTitle, rank) {
  const createDiv = (content, className) => {
    const div = document.createElement("div");
    div.className = className;
    div.textContent = content;
    return div;
  };

  const rankEl = createDiv(user ? rank + 1 : "R", isTitle ? "rank rank-title" : "rank rank-value");
  const nameEl = createDiv(user ? user.username : "Name", isTitle ? "name rank-title" : "name rank-value");
  const triesEl = createDiv(user ? formatNumber(user.tries) : "T", isTitle ? "tries rank-title" : "tries rank-value");
  const winsEl = createDiv(user ? formatNumber(user.wins) : "W", isTitle ? "wins rank-title" : "wins rank-value");
  const losesEl = createDiv(user ? formatNumber(user.loses) : "L", isTitle ? "loses rank-title" : "loses rank-value");
  const winRateEl = createDiv(user ? `${parseInt(user.winRate).toFixed(2)}%` : "W.R.", isTitle ? "win-rate rank-title" : "win-rate rank-value");

  if (user && user.username === localStorage.getItem("memory-blocks-username")) {
    [rankEl, nameEl, triesEl, winsEl, losesEl, winRateEl].forEach((el) => el.classList.add("the-user"));
  }

  rankUsersContainer.append(rankEl, nameEl, triesEl, winsEl, losesEl, winRateEl);
}

function removeChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function formatNumber(number) {
  return number < 1e3 ? number : number < 1e6 ? `${Math.trunc(number / 1e3)}K` : number < 1e9 ? `${Math.trunc(number / 1e6)}M` : "1B+";
}
