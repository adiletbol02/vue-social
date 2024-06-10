<template>
  <v-app>
    <v-card>
      <v-layout>
        <!-- App Bar -->
        <v-app-bar app>
          <img
            src="https://firebasestorage.googleapis.com/v0/b/vuesocial-5ebd2.appspot.com/o/system-images%2Fvue-social-logo.png?alt=media&token=0dc8cdf3-50b3-4ad8-bfac-0d9999fc2c03"
            alt="Vue Social Logo"
            height="40"
            class="ml-4"
          />

          <v-toolbar-title> Vue Social</v-toolbar-title>

          <!-- Drawer Toggle Button for smaller screens -->
          <v-btn v-if="!isDesktop" icon @click="drawer = !drawer">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </v-app-bar>

        <!-- Navigation Drawer -->
        <v-navigation-drawer
          v-model="drawer"
          location="right"
          :permanent="isDesktop"
          :temporary="!isDesktop"
          v-if="user"
        >
          <!-- Show only when a user is logged in -->
          <!-- User Profile Section in Drawer -->
          <template v-slot:prepend v-if="user">
            <v-list-item
              lines="two"
              router-link
              to="/vue-social/profile"
              :prepend-avatar="user.photoURL || 'default-profile.png'"
              subtitle="Logged in"
              :title="user.displayName || user.email"
            ></v-list-item>
          </template>

          <v-divider></v-divider>

          <!-- Navigation Links -->
          <v-list density="compact" nav>
            <v-list-item
              prepend-icon="mdi-home"
              title="Home"
              value="home"
              :to="{ name: 'Home' }"
            ></v-list-item>

            <v-list-item
              prepend-icon="mdi-newspaper"
              title="News"
              value="news"
              :to="{ name: 'News' }"
            ></v-list-item>

            <!-- Admin Link (Visible only to admins) -->
            <v-list-item
              v-if="user && user.isAdmin"
              prepend-icon="mdi-account"
              title="Admin"
              value="admin"
              :to="{ name: 'Admin' }"
            ></v-list-item>

            <!-- Register Link (Visible only when not logged in) -->
            <v-list-item
              v-if="!user"
              prepend-icon="mdi-account-plus-outline"
              title="Register"
              value="register"
              :to="{ name: 'Register' }"
            ></v-list-item>

            <!-- Sign In Link (Visible only when not logged in) -->
            <v-list-item
              v-if="!user"
              prepend-icon="mdi-login"
              title="Sign In"
              value="sign-in"
              :to="{ name: 'SignIn' }"
            ></v-list-item>

            <v-divider v-if="user"></v-divider>

            <!-- Sign Out Link (Visible only when logged in) -->
            <v-list-item
              v-if="user"
              prepend-icon="mdi-logout"
              title="Sign Out"
              value="sign-out"
              @click="handleSignOut"
            >
            </v-list-item>
          </v-list>
        </v-navigation-drawer>

        <!-- Main Content Area -->
        <v-main style="height: 100vh" class="overflow-auto">
          <router-view :user="user"></router-view>
        </v-main>
      </v-layout>
    </v-card>
  </v-app>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

// Refs for drawer state, display, router, current user, and desktop view
const drawer = ref(false);
const display = useDisplay();
const router = useRouter();
const user = ref(null);
const isDesktop = computed(() => display.width.value >= 1264);

onMounted(() => {
  // Set initial drawer state based on screen size
  drawer.value = isDesktop.value;

  // Listen for authentication state changes
  onAuthStateChanged(getAuth(), (currentUser) => {
    if (currentUser) {
      user.value = currentUser;
    } else {
      user.value = null;
    }
  });
});

// Sign out function
const handleSignOut = () => {
  signOut(getAuth())
    .then(() => {
      // Redirect to SignIn after successful sign out
      router.push({ name: "SignIn" });
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
};
</script>
