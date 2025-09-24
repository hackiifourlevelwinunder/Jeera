const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

let pendingResult = null;
let previousResult = null;
let finalResult = null;

async function getRandomFromRandomOrg() {
  try {
    let res = await fetch(
      "https://www.random.org/integers/?num=1&min=0&max=9&col=1&base=10&format=plain&rnd=new"
    );
    return parseInt(await res.text(), 10);
  } catch {
    return null;
  }
}

async function getRandomFromCSRNG() {
  try {
    let res = await fetch("https://csrng.net/csrng/csrng.php?min=0&max=9");
    let data = await res.json();
    return data[0].random;
  } catch {
    return null;
  }
}

async function getRandomFromQRNG() {
  try {
    let res = await fetch("https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint8");
    let data = await res.json();
    return data.data[0] % 10;
  } catch {
    return null;
  }
}

function getFrequencyNumber(numbers) {
  let freq = {};
  numbers.forEach((n) => {
    if (n !== null) {
      freq[n] = (freq[n] || 0) + 1;
    }
  });

  let best = null, max = -1;
  for (let n in freq) {
    if (freq[n] > max) {
      max = freq[n];
      best = parseInt(n, 10);
    }
  }
  return best !== null ? best : 0;
}

async function fetchNumbers() {
  let r1 = await getRandomFromRandomOrg();
  let r2 = await getRandomFromCSRNG();
  let r3 = await getRandomFromQRNG();
  let numbers = [r1, r2, r3];
  pendingResult = getFrequencyNumber(numbers);
  console.log("Fetched pendingResult:", pendingResult);
}

function scheduleRounds() {
  setInterval(() => {
    let now = new Date();
    let sec = now.getSeconds();

    // 25 sec -> fetch API
    if (sec === 25) {
      fetchNumbers();
    }

    // 30 sec -> previous = pendingResult
    if (sec === 30 && pendingResult !== null) {
      previousResult = pendingResult;
      console.log("Set previous:", previousResult);
    }

    // 00 sec -> final = pendingResult
    if (sec === 0 && pendingResult !== null) {
      finalResult = pendingResult;
      console.log("Set final:", finalResult);
    }
  }, 1000);
}

scheduleRounds();

app.get("/result", (req, res) => {
  res.json({
    previous: previousResult,
    final: finalResult,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
