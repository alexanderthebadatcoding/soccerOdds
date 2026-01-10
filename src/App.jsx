import React, { useState, useEffect } from "react";
import {
  Trophy,
  Calendar,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function App() {
  const [leagues, setLeagues] = useState([]);
  const [scores, setScores] = useState({});
  const [odds, setOdds] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedLeagues, setCollapsedLeagues] = useState({});

  const fetchLeaguesAndScores = async () => {
    setLoading(true);
    setError(null);

    try {
      /* ---------- LEAGUES ---------- */
      const leaguesRes = await fetch("/api/leagues");
      if (!leaguesRes.ok) throw new Error("Failed to load leagues");

      const leagueItems = await leaguesRes.json();
      if (!Array.isArray(leagueItems)) throw new Error("Bad league data");

      const validLeagues = leagueItems.map((l) => ({
        id: l.id,
        name: l.name,
        abbreviation: l.abbreviation,
        slug: l.slug,
      }));

      setLeagues(validLeagues);

      /* ---------- SCOREBOARDS ---------- */
      const scoresPairs = await Promise.all(
        validLeagues.map(async (league) => {
          try {
            const res = await fetch(`/api/scoreboard/${league.slug}`);
            const events = await res.json();
            return [league.id, Array.isArray(events) ? events : []];
          } catch {
            return [league.id, []];
          }
        })
      );

      const scoresData = Object.fromEntries(scoresPairs);
      setScores(scoresData);

      /* ---------- ODDS (LIVE ONLY) ---------- */
      const liveEvents = [];

      for (const league of validLeagues) {
        for (const event of scoresData[league.id] || []) {
          if (event?.status?.type?.state === "in") {
            liveEvents.push({ league, event });
          }
        }
      }

      const oddsPairs = await Promise.all(
        liveEvents.map(async ({ league, event }) => {
          try {
            const res = await fetch(`/api/odds/${league.slug}/${event.id}`);
            const data = await res.json();
            return data ? [event.id, data] : null;
          } catch {
            return null;
          }
        })
      );

      setOdds(Object.fromEntries(oddsPairs.filter(Boolean)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaguesAndScores();
  }, []);

  /* ---------- HELPERS ---------- */

  const isGameInTimeWindow = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const start = new Date();
    start.setDate(start.getDate() - 4);
    const end = new Date();
    end.setDate(end.getDate() + 8);
    return d >= start && d <= end;
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const americanOddsToPercentage = (odds) => {
    if (!odds) return null;
    const n = Number(odds);
    if (Number.isNaN(n)) return null;

    const p = n > 0 ? 100 / (n + 100) : Math.abs(n) / (Math.abs(n) + 100);
    return `${(p * 100).toFixed(1)}%`;
  };

  const toggleLeague = (id) => {
    setCollapsedLeagues((p) => ({ ...p, [id]: !p[id] }));
  };

  /* ---------- STATES ---------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }
  console.log("Leagues:", leagues);
  /* ---------- RENDER ---------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <Trophy className="w-10 h-10 mx-auto text-green-600" />
          <h1 className="text-4xl font-bold">Soccer Scoreboard</h1>
        </div>

        {leagues.map((league) => {
          const leagueEvents = (scores[league.id] || []).filter((e) =>
            isGameInTimeWindow(e?.date)
          );

          if (!leagueEvents.length) return null;

          return (
            <div key={league.id} className="bg-white rounded shadow">
              <div
                className="p-4 bg-green-600 text-white flex justify-between cursor-pointer"
                onClick={() => toggleLeague(league.id)}
              >
                <h2 className="text-xl font-bold">{league.name}</h2>
                {collapsedLeagues[league.id] ? <ChevronDown /> : <ChevronUp />}
              </div>

              {!collapsedLeagues[league.id] && (
                <div className="p-4 space-y-4">
                  {leagueEvents.map((event) => {
                    const competition = event?.competitions?.[0];
                    if (!competition) return null;

                    return (
                      <div key={event.id} className="border p-4 rounded">
                        <div className="flex justify-between text-sm mb-2">
                          <div className="flex gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(event.date)}
                            <Clock className="w-4 h-4 ml-2" />
                            {formatTime(event.date)}
                          </div>
                          <span>{event.status?.type?.shortDetail}</span>
                        </div>

                        {competition.competitors.map((team) => {
                          const eventOdds = odds[event.id];
                          const oddsValue =
                            team.homeAway === "home"
                              ? eventOdds?.home
                              : eventOdds?.away;

                          const pct =
                            event.status?.type?.state === "in"
                              ? americanOddsToPercentage(oddsValue)
                              : null;

                          return (
                            <div
                              key={team.id}
                              className="flex justify-between items-center"
                            >
                              <span>{team.team.displayName}</span>
                              <span className="font-bold">{team.score}</span>
                              {pct && <span className="text-xs">{pct}</span>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
