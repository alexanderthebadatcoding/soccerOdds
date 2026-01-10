export default async function handler(req, res) {
  try {
    const r = await fetch(
      "https://sports.core.api.espn.com/v2/sports/soccer/leagues?lang=en&region=us"
    );
    const data = await r.json();

    res.status(200).json(data.items?.slice(0, 26) || []);
  } catch {
    res.status(500).json([]);
  }
}
