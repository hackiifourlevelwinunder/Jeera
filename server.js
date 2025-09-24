import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));          // First frontend
app.use("/alt", express.static("public2")); // Second frontend

async function fetchRandomOrg() {
  try {
    const res = await fetch("https://api.random.org/json-rpc/4/invoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "generateIntegers",
        params: {
          apiKey: process.env.RANDOM_ORG_API_KEY,
          n: 1,
          min: 0,
          max: 9,
          replacement: true
        },
        id: 42
      })
    });
    const data = await res.json();
    return data.result.random.data[0];
  } catch (e) {
    console.error("Random.org error:", e.message);
    return null;
  }
}

async function fetchCSRNG() {
  try {
    const res = await fetch("https://www.randomnumberapi.com/api/v1.0/random?min=0&max=9&count=1");
    const data = await res.json();
    return data[0];
  } catch (e) {
    console.error("CSRNG error:", e.message);
    return null;
  }
}

async function fetchQRNG() {
  try {
    const res = await fetch("https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint8");
    const data = await res.json();
    return data.data[0] % 10;
  } catch (e) {
    console.error("QRNG error:", e.message);
    return null;
  }
}

function mostFrequentNumber(nums) {
  const freq = {};
  for (const n of nums) {
    if (n !== null) {
      freq[n] = (freq[n] || 0) + 1;
    }
  }
  let best = null, max = -1;
  for (const [num, count] of Object.entries(freq)) {
    if (count > max) {
      max = count;
      best = num;
    }
  }
  return best !== null ? parseInt(best) : null;
}

app.get("/api/number", async (req, res) => {
  const results = await Promise.all([fetchRandomOrg(), fetchCSRNG(), fetchQRNG()]);
  const finalNumber = mostFrequentNumber(results);
  res.json({ sources: results, final: finalNumber });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
