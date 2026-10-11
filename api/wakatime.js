const WAKATIME_API = "https://wakatime.com/api/v1/users/current/summaries";

function formatDuration(seconds) {
  const totalMinutes = Math.floor((Number(seconds) || 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  const apiKey = process.env.WAKATIME_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      error: "WakaTime is not configured yet. Add WAKATIME_API_KEY to the deployment environment.",
    });
  }

  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 6);

  const url = new URL(WAKATIME_API);
  url.searchParams.set("start", dateOnly(start));
  url.searchParams.set("end", dateOnly(today));

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const status = response.status === 401 || response.status === 403 ? 502 : response.status;
      return res.status(status).json({
        ok: false,
        error: response.status === 401 || response.status === 403
          ? "WakaTime rejected the API key."
          : "WakaTime API request failed.",
      });
    }

    const payload = await response.json();
    const summaries = Array.isArray(payload.data) ? payload.data : [];
    const grandTotal = summaries.reduce((total, day) => {
      const value = Number(day.grand_total?.total_seconds) || 0;
      return {
        seconds: total.seconds + value,
        text: "",
      };
    }, { seconds: 0, text: "" });

    grandTotal.text = formatDuration(grandTotal.seconds);

    const days = summaries.map((day) => ({
      date: day.range?.date || "",
      seconds: Number(day.grand_total?.total_seconds) || 0,
      text: day.grand_total?.text || formatDuration(day.grand_total?.total_seconds),
    }));

    const languageTotals = new Map();
    const projectTotals = new Map();

    for (const day of summaries) {
      for (const language of (day.languages || [])) {
        const key = language.name || "Other";
        languageTotals.set(key, (languageTotals.get(key) || 0) + (Number(language.total_seconds) || 0));
      }

      for (const project of (day.projects || [])) {
        const key = project.name || "Unknown project";
        projectTotals.set(key, (projectTotals.get(key) || 0) + (Number(project.total_seconds) || 0));
      }
    }

    const totalSeconds = grandTotal.seconds;
    const languages = [...languageTotals.entries()]
      .map(([name, seconds]) => ({
        name,
        seconds,
        percent: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0,
      }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 5);

    const projects = [...projectTotals.entries()]
      .map(([name, seconds]) => ({
        name,
        seconds,
        text: formatDuration(seconds),
      }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 3);

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({
        ok: true,
        total: grandTotal,
        days,
        languages,
        projects,
        updatedAt: new Date().toISOString(),
      });
  } catch (error) {
    console.error("WakaTime API error:", error);
    return res.status(502).json({
      ok: false,
      error: "Unable to retrieve WakaTime data right now.",
    });
  }
};
