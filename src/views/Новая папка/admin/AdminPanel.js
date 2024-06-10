<template>
  <v-container>
    <v-card class="pa-5">
      <v-card-title class="text-h5 text-center">Admin Panel</v-card-title>

      <v-tabs v-model="activeTab" color="primary">
        <v-tab value="users">User Management</v-tab>
        <v-tab value="news">News Management</v-tab>
      </v-tabs>

      <!-- Tab Content -->
      <v-window v-model="activeTab">
        <v-window-item value="users">
          <UserManagement />
        </v-window-item>

        <v-window-item value="news">
          <NewsManagement />
        </v-window-item>
      </v-window>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import UserManagement from "./UserManagement.vue";
import NewsManagement from "./NewsManagement.vue";

const activeTab = ref("users");
</script>
