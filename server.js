import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, "public")));

let pendingResult = null;
let previousResult = null;
let finalResult = null;

// --- Random.org API ---
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

// --- CSRNG API ---
async function getRandomFromCSRNG() {
  try {
    let res = await fetch("https://csrng.net/csrng/csrng.php?min=0&max=9");
    let data = await res.json();
    return data[0].random;
  } catch {
    return null;
  }
}

// --- QRNG API ---
async function getRandomFromQRNG() {
  try {
    let res = await fetch("https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint8");
    let data = await res.json();
    return data.data[0] % 10;
  } catch {
    return null;
  }
}

// --- Frequency calculation ---
function getFrequencyNumber(numbers) {
  let freq = {};
  numbers.forEach((n) => {
    if (n !== null) {
      freq[n] = (freq[n] || 0) + 1;
    }
  });

  let best = null;
  let max = -1;
  for (let n in freq) {
    if (freq[n] > max) {
      max = freq[n];
      best = parseInt(n, 10);
    }
  }
  return best !== null ? best : 0;
}

// --- Fetch numbers ---
async function fetchNumbers() {
  let r1 = await getRandomFromRandomOrg();
  let r2 = await getRandomFromCSRNG();
  let r3 = await getRandomFromQRNG();

  let numbers = [r1, r2, r3];
  pendingResult = getFrequencyNumber(numbers);

  console.log("Fetched pendingResult:", pendingResult);
}

// --- Schedule round timing ---
function scheduleRounds() {
  setInterval(() => {
    let now = new Date();
    let sec = now.getSeconds();

    if (sec === 25) {
      fetchNumbers();
    }
    if (sec === 30 && pendingResult !== null) {
      previousResult = pendingResult;
      console.log("Previous set:", previousResult);
    }
    if (sec === 0 && pendingResult !== null) {
      finalResult = pendingResult;
      console.log("Final set:", finalResult);
    }
  }, 1000);
}

scheduleRounds();

// --- API endpoint ---
app.get("/result", (req, res) => {
  res.json({
    previous: previousResult,
    final: finalResult,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
