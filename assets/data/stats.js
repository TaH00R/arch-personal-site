(function () {
  window.TAHOOR_DATA = window.TAHOOR_DATA || {};

  // Keep this file as the single source for personal stats.
  // Set enabled: true and fill in the values when you are ready.
  window.TAHOOR_DATA.stats = {
    steam: {
      enabled: false,
      profile: "",
      games: null,
      hours: null,
      favorite: "",
      favoriteHours: null,
    },
    spotify: {
      enabled: false,
      profile: "",
      minutes: null,
      topArtist: "",
      topTrack: "",
      topAlbum: "",
    },
    github: {
      enabled: false,
      profile: "https://github.com/TaH00R",
      repositories: null,
      contributions: null,
      stars: null,
    },
  };
})();
