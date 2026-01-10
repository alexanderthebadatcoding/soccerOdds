export default async function handler(req, res) {
  const { league, eventId } = req.query;

  try {
    const r = await fetch(
      `https://sports.core.api.espn.com/v2/sports/soccer/leagues/${league}/events/${eventId}/competitions/${eventId}/odds`
    );
    const data = await r.json();

    const item = data.items?.[0];
    if (!item) return res.status(200).json(null);

    res.status(200).json({
      home: item.homeTeamOdds?.current?.moneyLine?.american,
      away: item.awayTeamOdds?.current?.moneyLine?.american,
    });
  } catch {
    res.status(200).json(null);
  }
}
