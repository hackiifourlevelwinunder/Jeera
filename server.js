import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const randomApiKey = process.env.RANDOM_API_KEY;

// Get numbers from Random.org + QRNG + CSRNG
async function getNumbers() {
  try {
    // 🔹 Random.org (needs API key)
    let randomNum = null;
    if (randomApiKey) {
      const randomRes = await fetch("https://api.random.org/json-rpc/4/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "generateIntegers",
          params: {
            apiKey: randomApiKey,
            n: 1,
            min: 0,
            max: 9,
            replacement: true
          },
          id: 1
        })
      });
      const randomData = await randomRes.json();
      randomNum = randomData?.result?.random?.data[0] ?? null;
    }

    // 🔹 QRNG
    const qrngRes = await fetch("https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint8");
    const qrngData = await qrngRes.json();
    const qrngNum = qrngData?.data ? qrngData.data[0] % 10 : null;

    // 🔹 CSRNG
    const csrngRes = await fetch("https://csrng.net/csrng/csrng.php?min=0&max=9");
    const csrngData = await csrngRes.json();
    const csrngNum = csrngData?.[0]?.random || null;

    // Combine
    const nums = [randomNum, qrngNum, csrngNum].filter(n => n !== null);

    // Frequency
    const freq = {};
    nums.forEach(n => {
      freq[n] = (freq[n] || 0) + 1;
    });

    // Highest frequency
    let finalNum = nums[0];
    let maxFreq = 0;
    for (const [num, count] of Object.entries(freq)) {
      if (count > maxFreq) {
        maxFreq = count;
        finalNum = num;
      }
    }

    return { nums, finalNum };
  } catch (err) {
    console.error("Error fetching numbers:", err);
    return { nums: [], finalNum: null };
  }
}

// API endpoint
app.get("/api/number", async (req, res) => {
  const result = await getNumbers();
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
