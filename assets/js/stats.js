(function () {
  "use strict";

  const DATA = window.TAHOOR_DATA || {};
  const CONFIG = DATA.stats || {};

  // Bump the namespace so old API responses are ignored.
  const CACHE_PREFIX = "tahoor.stats.v3.";
  const CACHE_TTL = 5 * 60 * 1000;

  // Public API endpoints.
  const ENDPOINTS = {
    // GitHub profile.
    githubUser: (username) =>
      `https://api.github.com/users/${encodeURIComponent(username)}`,

    // GitHub contribution calendar.
    githubContributions: (username) =>
      `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,

    // Codeforces profile.
    codeforcesUser: (handle) =>
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,

    // Codeforces rating history.
    codeforcesRating: (handle) =>
      `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`,

    // Codeforces submissions.
    codeforcesStatus: (handle) =>
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&count=1000`,

    // LeetCode summary.
    leetcodeUser: (username) =>
      `https://leetcode-stats.tashif.codes/${encodeURIComponent(username)}`,

    // LeetCode detailed solving statistics.
    leetcodeStats: (username) =>
      `https://leetcode-stats.tashif.codes/${encodeURIComponent(username)}/stats`,

    // LeetCode profile.
    leetcodeProfile: (username) =>
      `https://leetcode-stats.tashif.codes/${encodeURIComponent(username)}/profile`,

    // LeetCode contest history.
    leetcodeContests: (username) =>
      `https://leetcode-stats.tashif.codes/${encodeURIComponent(username)}/contests`,

    // LeetCode activity heatmap.
    leetcodeHeatmap: (username) =>
      `https://leetcode-stats.tashif.codes/${encodeURIComponent(username)}/heatmap`,
  };


  // Build a namespaced cache key.
  function cacheKey(name) {
    return CACHE_PREFIX + name;
  }


  // Read cached JSON if it is still fresh.
  function readCache(name) {
    try {
      const raw =
        sessionStorage.getItem(
          cacheKey(name)
        );

      if (!raw) {
        return null;
      }

      const cached =
        JSON.parse(raw);

      if (
        !cached ||
        !cached.timestamp
      ) {
        return null;
      }

      if (
        Date.now() -
        cached.timestamp >
        CACHE_TTL
      ) {
        sessionStorage.removeItem(
          cacheKey(name)
        );

        return null;
      }

      return cached.data;
    } catch {
      return null;
    }
  }


  // Write JSON into the session cache.
  function writeCache(name, data) {
    try {
      sessionStorage.setItem(
        cacheKey(name),
        JSON.stringify({
          timestamp: Date.now(),
          data,
        })
      );
    } catch {
      // Ignore storage failures.
    }
  }


  // Fetch JSON with timeout and optional caching.
  async function fetchJson(
    url,
    options = {}
  ) {
    const {
      timeout = 12000,
      headers = {},
      cacheName = null,
    } = options;

    if (cacheName) {
      const cached =
        readCache(cacheName);

      if (cached !== null) {
        return {
          data: cached,
          cached: true,
        };
      }
    }

    const controller =
      new AbortController();

    const timer = setTimeout(
      () => {
        controller.abort();
      },
      timeout
    );

    try {
      const response =
        await fetch(url, {
          method: "GET",

          headers: {
            Accept:
              "application/json",
            ...headers,
          },

          signal:
            controller.signal,
        });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText}`
        );
      }

      const data =
        await response.json();

      if (cacheName) {
        writeCache(
          cacheName,
          data
        );
      }

      return {
        data,
        cached: false,
      };
    } finally {
      clearTimeout(timer);
    }
  }


  // Convert a value into a finite number.
  function numberOrZero(value) {
    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  }


  // Return an array or an empty array.
  function safeArray(value) {
    return Array.isArray(value)
      ? value
      : [];
  }


  // Return the current ISO timestamp.
  function now() {
    return new Date()
      .toISOString();
  }


  // Unwrap nested data envelopes.
  function deepUnwrap(payload) {
    let data = payload;

    for (
      let i = 0;
      i < 5;
      i++
    ) {
      if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        data.data &&
        typeof data.data ===
          "object"
      ) {
        data = data.data;
      } else {
        break;
      }
    }

    return data || {};
  }


  // Pick the first useful value.
  function firstValue(
    ...values
  ) {
    for (
      const value of values
    ) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return null;
  }


  // Normalize Codeforces avatar URLs.
  function normalizeCodeforcesImage(
    url
  ) {
    if (!url) {
      return null;
    }

    let value =
      String(url).trim();

    if (
      value.startsWith("//")
    ) {
      value =
        "https:" + value;
    }

    if (
      value.startsWith(
        "https://userpic.codeforces.org/"
      )
    ) {
      return value.replace(
        "https://userpic.codeforces.org/",
        "https://codeforces.com/userpic.codeforces.org/"
      );
    }

    return value;
  }


  // Build a reliable GitHub avatar URL.
  function normalizeGithubAvatar(
    profile,
    username
  ) {
    if (
      profile?.id
    ) {
      return (
        `https://avatars.githubusercontent.com/u/` +
        `${profile.id}?v=4`
      );
    }

    if (
      profile?.avatar_url
    ) {
      return profile.avatar_url;
    }

    return (
      `https://github.com/` +
      `${encodeURIComponent(username)}.png?size=96`
    );
  }


  // Normalize a LeetCode submission calendar.
  function normalizeLeetcodeCalendar(
    calendar
  ) {
    if (
      !calendar ||
      typeof calendar !==
        "object" ||
      Array.isArray(calendar)
    ) {
      return [];
    }

    return Object.entries(
      calendar
    ).map(
      ([timestamp, count]) => {
        const numericCount =
          numberOrZero(count);

        let level = 0;

        if (
          numericCount === 0
        ) {
          level = 0;
        } else if (
          numericCount <= 2
        ) {
          level = 1;
        } else if (
          numericCount <= 5
        ) {
          level = 2;
        } else if (
          numericCount <= 9
        ) {
          level = 3;
        } else {
          level = 4;
        }

        return {
          date:
            new Date(
              Number(timestamp) *
                1000
            )
              .toISOString()
              .slice(0, 10),

          count:
            numericCount,

          level,
        };
      }
    );
  }


  // Normalize LeetCode heatmap data.
  function normalizeLeetcodeHeatmap(
    payload
  ) {
    const data =
      deepUnwrap(payload);

    if (
      Array.isArray(
        data.dailyContributions
      )
    ) {
      return data.dailyContributions.map(
        (day) => ({
          date: day.date,

          count:
            numberOrZero(
              day.count
            ),

          level:
            numberOrZero(
              day.level
            ),
        })
      );
    }

    if (
      Array.isArray(
        data.contributions
      )
    ) {
      return data.contributions.map(
        (day) => ({
          date: day.date,

          count:
            numberOrZero(
              day.count
            ),

          level:
            numberOrZero(
              day.level
            ),
        })
      );
    }

    return normalizeLeetcodeCalendar(
      firstValue(
        data.submissionCalendar,
        data.submission_calendar
      )
    );
  }


  // Normalize LeetCode contest history for the rating graph.
  function normalizeLeetcodeRatingHistory(
    history
  ) {
    return safeArray(
      history
    )
      .map(
        (item) => {
          const contest =
            item?.contest ||
            {};

          const rating =
            numberOrZero(
              firstValue(
                item.rating,
                item.newRating,
                item.new_rating
              )
            );

          const title =
            firstValue(
              contest.title,
              item.contestName,
              item.title
            ) || "Contest";

          const timestamp =
            firstValue(
              contest.startTime,
              item.startTime,
              item.timestamp
            );

          return {
            contestName:
              title,

            rating,

            ranking:
              numberOrZero(
                firstValue(
                  item.ranking,
                  item.rank
                )
              ),

            date:
              timestamp
                ? new Date(
                    Number(timestamp) *
                      1000
                  ).toISOString()
                : null,
          };
        }
      )
      .filter(
        (item) =>
          item.rating > 0
      );
  }


  // Fetch GitHub data.
  async function fetchGitHub() {
    const config =
      CONFIG.github || {};

    if (
      !config.enabled ||
      !config.username
    ) {
      return {
        enabled: false,
        ok: false,

        error:
          "GitHub username is not configured.",
      };
    }

    const username =
      config.username;

    try {
      const [
        profileResult,
        contributionsResult,
      ] =
        await Promise.allSettled([
          fetchJson(
            ENDPOINTS.githubUser(
              username
            ),
            {
              cacheName:
                `github.user.${username}`,
            }
          ),

          fetchJson(
            ENDPOINTS.githubContributions(
              username
            ),
            {
              cacheName:
                `github.contributions.${username}`,
            }
          ),
        ]);

      if (
        profileResult.status !==
        "fulfilled"
      ) {
        throw new Error(
          profileResult.reason
            ?.message ||
          "Unable to fetch GitHub profile."
        );
      }

      const profile =
        profileResult.value.data;

      const contributions =
        contributionsResult.status ===
        "fulfilled"
          ? contributionsResult.value.data
          : null;

      const contributionDays =
        safeArray(
          contributions?.contributions
        );

      const contributionTotal =
        contributions?.total
          ?.lastYear != null
          ? numberOrZero(
              contributions
                .total.lastYear
            )
          : contributionDays.reduce(
              (sum, day) =>
                sum +
                numberOrZero(
                  day.count
                ),
              0
            );

      return {
        enabled: true,
        ok: true,

        username:
          profile.login ||
          username,

        name:
          profile.name ||
          profile.login ||
          username,

        avatar:
          normalizeGithubAvatar(
            profile,
            username
          ),

        bio:
          profile.bio || "",

        profile:
          profile.html_url ||
          config.profile ||
          `https://github.com/${username}`,

        publicRepos:
          numberOrZero(
            profile.public_repos
          ),

        followers:
          numberOrZero(
            profile.followers
          ),

        following:
          numberOrZero(
            profile.following
          ),

        publicGists:
          numberOrZero(
            profile.public_gists
          ),

        contributions: {
          total:
            contributionTotal,

          days:
            contributionDays,

          yearlyTotals:
            contributions?.total ||
            {},
        },

        updatedAt: now(),
      };
    } catch (error) {
      return {
        enabled: true,
        ok: false,

        username,

        profile:
          config.profile ||
          `https://github.com/${username}`,

        error:
          error?.message ||
          "GitHub request failed.",

        updatedAt: now(),
      };
    }
  }


  // Fetch Codeforces data.
  async function fetchCodeforces() {
    const config =
      CONFIG.codeforces || {};

    if (
      !config.enabled ||
      !config.handle
    ) {
      return {
        enabled: false,
        ok: false,

        error:
          "Codeforces handle is not configured.",
      };
    }

    const handle =
      config.handle;

    try {
      const [
        userResult,
        ratingResult,
        statusResult,
      ] =
        await Promise.allSettled([
          fetchJson(
            ENDPOINTS.codeforcesUser(
              handle
            ),
            {
              cacheName:
                `cf.user.${handle}`,
            }
          ),

          fetchJson(
            ENDPOINTS.codeforcesRating(
              handle
            ),
            {
              cacheName:
                `cf.rating.${handle}`,
            }
          ),

          fetchJson(
            ENDPOINTS.codeforcesStatus(
              handle
            ),
            {
              cacheName:
                `cf.status.${handle}`,
            }
          ),
        ]);

      if (
        userResult.status !==
        "fulfilled"
      ) {
        throw new Error(
          userResult.reason
            ?.message ||
          "Unable to fetch Codeforces profile."
        );
      }

      const userPayload =
        userResult.value.data;

      if (
        userPayload.status !==
        "OK"
      ) {
        throw new Error(
          userPayload.comment ||
          "Codeforces returned an error."
        );
      }

      const user =
        userPayload.result?.[0];

      if (!user) {
        throw new Error(
          "Codeforces user not found."
        );
      }

      const ratingHistory =
        ratingResult.status ===
        "fulfilled"
          ? safeArray(
              ratingResult.value
                .data?.result
            )
          : [];

      const submissions =
        statusResult.status ===
        "fulfilled"
          ? safeArray(
              statusResult.value
                .data?.result
            )
          : [];

      // Count unique accepted problems in the returned submission window.
      const solvedProblems =
        new Set();

      submissions.forEach(
        (submission) => {
          if (
            submission.verdict !==
            "OK"
          ) {
            return;
          }

          const problem =
            submission.problem;

          if (!problem) {
            return;
          }

          const key = [
            problem.contestId ??
              "gym",

            problem.index ??
              "",

            problem.name ??
              "",
          ].join(":");

          solvedProblems.add(
            key
          );
        }
      );

      const latestRating =
        ratingHistory.length > 0
          ? ratingHistory[
              ratingHistory.length - 1
            ]
          : null;

      const bestRating =
        ratingHistory.reduce(
          (best, contest) =>
            Math.max(
              best,
              numberOrZero(
                contest.newRating
              )
            ),
          0
        );

      return {
        enabled: true,
        ok: true,

        handle:
          user.handle ||
          handle,

        name:
          [
            user.firstName,
            user.lastName,
          ]
            .filter(Boolean)
            .join(" ") ||
          user.handle ||
          handle,

        avatar:
          normalizeCodeforcesImage(
            user.avatar
          ),

        rank:
          user.rank ||
          "unrated",

        maxRank:
          user.maxRank ||
          "unrated",

        rating:
          numberOrZero(
            user.rating
          ),

        maxRating:
          numberOrZero(
            user.maxRating
          ),

        contests:
          ratingHistory.length,

        solvedFromRecentSubmissions:
          solvedProblems.size,

        ratingHistory:
          ratingHistory.map(
            (item) => ({
              contestId:
                item.contestId,

              contestName:
                item.contestName,

              rank:
                numberOrZero(
                  item.rank
                ),

              oldRating:
                numberOrZero(
                  item.oldRating
                ),

              newRating:
                numberOrZero(
                  item.newRating
                ),

              ratingChange:
                numberOrZero(
                  item.newRating
                ) -
                numberOrZero(
                  item.oldRating
                ),

              date:
                item.ratingUpdateTimeSeconds
                  ? new Date(
                      item.ratingUpdateTimeSeconds *
                        1000
                    ).toISOString()
                  : null,
            })
          ),

        latestContest:
          latestRating
            ? {
                contestId:
                  latestRating.contestId,

                contestName:
                  latestRating.contestName,

                rank:
                  numberOrZero(
                    latestRating.rank
                  ),

                ratingChange:
                  numberOrZero(
                    latestRating.newRating
                  ) -
                  numberOrZero(
                    latestRating.oldRating
                  ),
              }
            : null,

        bestRating,

        profile:
          config.profile ||
          `https://codeforces.com/profile/${handle}`,

        updatedAt: now(),
      };
    } catch (error) {
      return {
        enabled: true,
        ok: false,

        handle,

        profile:
          config.profile ||
          `https://codeforces.com/profile/${handle}`,

        error:
          error?.message ||
          "Codeforces request failed.",

        updatedAt: now(),
      };
    }
  }


  // Fetch LeetCode data.
  async function fetchLeetCode() {
    const config =
      CONFIG.leetcode || {};

    if (
      !config.enabled ||
      !config.username
    ) {
      return {
        enabled: false,
        ok: false,

        error:
          "LeetCode username is not configured.",
      };
    }

    const username =
      config.username;

    try {
      const [
        summaryResult,
        statsResult,
        profileResult,
        contestResult,
        heatmapResult,
      ] =
        await Promise.allSettled([
          fetchJson(
            ENDPOINTS.leetcodeUser(
              username
            ),
            {
              cacheName:
                `leetcode.user.${username}`,
            }
          ),

          fetchJson(
            ENDPOINTS.leetcodeStats(
              username
            ),
            {
              cacheName:
                `leetcode.stats.${username}`,
            }
          ),

          fetchJson(
            ENDPOINTS.leetcodeProfile(
              username
            ),
            {
              cacheName:
                `leetcode.profile.${username}`,
            }
          ),

          fetchJson(
            ENDPOINTS.leetcodeContests(
              username
            ),
            {
              cacheName:
                `leetcode.contests.${username}`,
            }
          ),

          fetchJson(
            ENDPOINTS.leetcodeHeatmap(
              username
            ),
            {
              cacheName:
                `leetcode.heatmap.${username}`,
            }
          ),
        ]);

      if (
        summaryResult.status !==
        "fulfilled"
      ) {
        throw new Error(
          summaryResult.reason
            ?.message ||
          "Unable to fetch LeetCode summary."
        );
      }

      const summary =
        deepUnwrap(
          summaryResult.value.data
        );

      const stats =
        statsResult.status ===
        "fulfilled"
          ? deepUnwrap(
              statsResult.value.data
            )
          : {};

      const profile =
        profileResult.status ===
        "fulfilled"
          ? deepUnwrap(
              profileResult.value.data
            )
          : {};

      const contest =
        contestResult.status ===
        "fulfilled"
          ? deepUnwrap(
              contestResult.value.data
            )
          : {};

      const heatmap =
        heatmapResult.status ===
        "fulfilled"
          ? deepUnwrap(
              heatmapResult.value.data
            )
          : {};

      // Extract profile fields from the nested profile object.
      const profileData =
        profile.profile &&
        typeof profile.profile ===
          "object"
          ? profile.profile
          : profile;

      // Extract solved counts from both summary and stats.
      const totalSolved =
        numberOrZero(
          firstValue(
            summary.totalSolved,
            stats.totalSolved
          )
        );

      const easySolved =
        numberOrZero(
          firstValue(
            summary.easySolved,
            stats.easySolved,
            stats.byDifficulty?.easy
          )
        );

      const mediumSolved =
        numberOrZero(
          firstValue(
            summary.mediumSolved,
            stats.mediumSolved,
            stats.byDifficulty?.medium
          )
        );

      const hardSolved =
        numberOrZero(
          firstValue(
            summary.hardSolved,
            stats.hardSolved,
            stats.byDifficulty?.hard
          )
        );

      // Extract the documented contest history.
      const contestHistory =
        safeArray(
          firstValue(
            contest.contestHistory,
            contest.history
          )
        );

      // Normalize contest history for future graph rendering.
      const ratingHistory =
        normalizeLeetcodeRatingHistory(
          contestHistory
        );

      // Extract contest rating from the canonical contest response.
      let contestRating =
        numberOrZero(
          firstValue(
            contest.rating,
            summary.currentRating
          )
        );

      // Fall back to the newest attended contest rating.
      if (
        contestRating === 0 &&
        ratingHistory.length > 0
      ) {
        contestRating =
          ratingHistory[
            ratingHistory.length - 1
          ].rating;
      }

      // Extract global contest ranking.
      const globalRanking =
        numberOrZero(
          firstValue(
            summary.ranking,
            profileData.ranking,
            contest.globalRanking
          )
        );

      // Extract total attended contests.
      let attendedContests =
        numberOrZero(
          firstValue(
            contest.attendedContestsCount,
            contest.count,
            summary.totalContests
          )
        );

      // Fall back to counting attended contest entries.
      if (
        attendedContests === 0 &&
        contestHistory.length > 0
      ) {
        attendedContests =
          contestHistory.filter(
            (item) =>
              item?.attended !== false
          ).length;
      }

      // Extract the maximum contest rating.
      const maxContestRating =
        numberOrZero(
          firstValue(
            contest.maxRating,
            summary.maxRating
          )
        );

      // Normalize LeetCode heatmap entries.
      const heatmapDays =
        normalizeLeetcodeHeatmap(
          heatmap
        );

      // Extract total submissions.
      const totalSubmissions =
        numberOrZero(
          firstValue(
            heatmap.totalSubmissions,
            summary.totalSubmissions
          )
        );

      // Extract active days.
      const activeDays =
        numberOrZero(
          firstValue(
            heatmap.activeDays,
            heatmap.totalActiveDays,
            summary.totalActiveDays
          )
        );

      // Extract current streak.
      const currentStreak =
        numberOrZero(
          firstValue(
            heatmap.currentStreak,
            summary.currentStreak
          )
        );

      // Extract longest streak.
      const longestStreak =
        numberOrZero(
          firstValue(
            heatmap.longestStreak,
            summary.longestStreak
          )
        );

      // Extract acceptance rate.
      const acceptanceRate =
        numberOrZero(
          firstValue(
            summary.acceptanceRate,
            stats.acceptanceRate
          )
        );

      // Extract profile identity.
      const name =
        firstValue(
          profileData.realName,
          profileData.displayName,
          summary.name,
          username
        );

      // Extract profile avatar.
      const avatar =
        firstValue(
          profileData.userAvatar,
          profileData.avatar,
          profile.userAvatar,
          profile.avatar,
          summary.avatar
        );

      // Keep the calendar as a fallback for other consumers.
      const submissionCalendar =
        firstValue(
          summary.submissionCalendar,
          summary.submission_calendar,
          profile.submissionCalendar,
          heatmap.submissionCalendar
        );

      // Capture partial endpoint failures without killing the whole card.
      const endpointErrors = [];

      if (
        statsResult.status !==
        "fulfilled"
      ) {
        endpointErrors.push(
          "stats"
        );
      }

      if (
        profileResult.status !==
        "fulfilled"
      ) {
        endpointErrors.push(
          "profile"
        );
      }

      if (
        contestResult.status !==
        "fulfilled"
      ) {
        endpointErrors.push(
          "contests"
        );
      }

      if (
        heatmapResult.status !==
        "fulfilled"
      ) {
        endpointErrors.push(
          "heatmap"
        );
      }

      return {
        enabled: true,
        ok: true,

        username,

        name,

        avatar:
          avatar || null,

        totalSolved,

        easySolved,

        mediumSolved,

        hardSolved,

        totalQuestions:
          numberOrZero(
            firstValue(
              summary.totalQuestions,
              stats.totalQuestions
            )
          ),

        acceptanceRate,

        ranking:
          globalRanking,

        contributionPoints:
          numberOrZero(
            firstValue(
              summary.contributionPoints,
              profileData.contributions?.points
            )
          ),

        reputation:
          numberOrZero(
            firstValue(
              summary.reputation,
              profileData.reputation
            )
          ),

        contest: {
          rating:
            contestRating,

          maxRating:
            maxContestRating,

          globalRanking:
            globalRanking,

          attendedContests:
            attendedContests,

          history:
            contestHistory,
        },

        ratingHistory,

        activity: {
          days:
            heatmapDays,

          totalSubmissions:
            totalSubmissions,

          activeDays:
            activeDays,

          currentStreak:
            currentStreak,

          longestStreak:
            longestStreak,
        },

        submissionCalendar:
          submissionCalendar || null,

        partialErrors:
          endpointErrors,

        profile:
          config.profile ||
          `https://leetcode.com/u/${username}/`,

        updatedAt: now(),
      };
    } catch (error) {
      return {
        enabled: true,
        ok: false,

        username,

        profile:
          config.profile ||
          `https://leetcode.com/u/${username}/`,

        error:
          error?.message ||
          "LeetCode request failed.",

        updatedAt: now(),
      };
    }
  }


  // Load all platform data simultaneously.
  async function loadAllStats() {
    const startedAt =
      performance.now();

    window.TAHOOR_STATS = {
      status: "loading",

      startedAt:
        now(),

      github: null,

      leetcode: null,

      codeforces: null,
    };

    dispatch();

    const [
      github,
      leetcode,
      codeforces,
    ] = await Promise.all([
      fetchGitHub(),
      fetchLeetCode(),
      fetchCodeforces(),
    ]);

    const finishedAt =
      now();

    const result = {
      status: "ready",

      github,

      leetcode,

      codeforces,

      startedAt:
        window.TAHOOR_STATS
          .startedAt,

      finishedAt,

      durationMs:
        Math.round(
          performance.now() -
          startedAt
        ),
    };

    window.TAHOOR_STATS =
      result;

    dispatch();

    return result;
  }


  // Dispatch the updated stats object.
  function dispatch() {
    window.dispatchEvent(
      new CustomEvent(
        "tahoor:stats",
        {
          detail:
            window.TAHOOR_STATS,
        }
      )
    );
  }


  // Clear only this dashboard's cache.
  function refreshStats() {
    try {
      Object.keys(
        sessionStorage
      )
        .filter(
          (key) =>
            key.startsWith(
              CACHE_PREFIX
            )
        )
        .forEach(
          (key) => {
            sessionStorage.removeItem(
              key
            );
          }
        );
    } catch {
      // Ignore storage failures.
    }

    return loadAllStats();
  }


  // Expose the stats API to the dashboard.
  window.TAHOOR_STATS_API = {
    load:
      loadAllStats,

    refresh:
      refreshStats,

    github:
      fetchGitHub,

    leetcode:
      fetchLeetCode,

    codeforces:
      fetchCodeforces,
  };


  // Start loading when the document is ready.
  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      loadAllStats,
      {
        once: true,
      }
    );
  } else {
    loadAllStats();
  }
})();