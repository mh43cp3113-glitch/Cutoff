// Extends app.json. The only thing computed here is the web base URL: GitHub
// Pages serves this project at /Cutoff/, so the CI build sets
// EXPO_PUBLIC_BASE_URL=/Cutoff. Local dev and native builds leave it unset and
// serve from the root.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments || {}),
    baseUrl: process.env.EXPO_PUBLIC_BASE_URL || '',
  },
});
