const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.post("/analyze", async (req, res) => {
  const { t1, t2, venue, mtime, toss } = req.body;

  const prompt = `You are a cricket fantasy analyst. Analyze the upcoming IPL match: ${t1} vs ${t2} at ${venue}, ${mtime}. Toss: ${toss}.

Use web search to find:
1. Recent form of key players from both teams (last 3-5 matches)
2. Recent scores and performances  
3. Any injury news or squad changes
4. Pitch and weather conditions at ${venue} today

Then respond ONLY with a valid JSON object (no markdown, no backticks) in exactly this format:
{
  "venue_insight": "2-3 sentences about current pitch and conditions",
  "toss_advice": "specific advice based on toss result",
  "key_insight": "most important thing to know for this match",
  "players": [
    {
      "name": "player full name",
      "team": "team name",
      "role": "BAT or BOWL or AR or WK",
      "bat_pos": 1,
      "recent_form": "brief last 3 matches description",
      "last3_scores": "45, 12, 78 or 2/24, 1/32",
      "avg": 45,
      "std": 20,
      "ownership_est": 65,
      "flags": ["MUST PICK"],
      "why": "one sentence pick or avoid reason",
      "pick": true
    }
  ],
  "recommended_xi": ["name1","name2","name3","name4","name5","name6","name7","name8","name9","name10","name11"],
  "captain": "player name",
  "vc": "player name"
}
Include all 11 players per team (22 total). Use ceiling formula: Score = avg + (2.5 * std).`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        tools: [{ "type": "web_search_20250305", "name": "web_search" }],
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.type === "text" ? i.text : "").join("");
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    const result = JSON.parse(text.slice(start, end));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.listen(3000, () => console.log("FantasyEdge backend running on port 3000"));
