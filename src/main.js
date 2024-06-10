import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

// Import Firebase services from firebase.js
import { auth } from "@/firebase.js";

const app = createApp(App);

const vuetify = createVuetify({
  components,
  directives,
});

// Use Vue Router and Vuetify
app.use(router).use(vuetify);

// Access auth state in your main Vue instance
app.config.globalProperties.$auth = auth;

app.mount("#app");
