module.exports = {
  preset: '@vue/cli-plugin-unit-jest', // For Vue CLI projects
  transform: {
    "^.+\\.vue$": "vue-jest", // Process Vue single-file components
  },
  // ... other Jest configuration options ...
};
