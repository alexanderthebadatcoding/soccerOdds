export default async function handler(req, res) {
  const { slug, eventId } = req.query;

  try {
    const r = await fetch(
      `https://sports.core.api.espn.com/v2/sports/soccer/leagues/${slug}/events/${eventId}/competitions/${eventId}/odds`
    );
    const data = await r.json();

    if (!data?.items?.length) return res.status(200).json(null);

    const o = data.items[0];

    res.status(200).json({
      home: o.homeTeamOdds?.current?.moneyLine?.american,
      away: o.awayTeamOdds?.current?.moneyLine?.american,
    });
  } catch {
    res.status(200).json(null);
  }
}
