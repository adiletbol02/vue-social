<template>
  <div>
    <!-- Search Field -->
    <v-text-field
      v-model="searchQuery"
      label="Search Users"
      variant="outlined"
      class="mb-4"
    ></v-text-field>

    <v-table>
      <thead>
        <tr>
          <th>Display Name</th>
          <th>Email</th>
          <th>Admin</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.uid">
          <td>{{ user.displayName }}</td>
          <td>{{ user.email }}</td>
          <td>
            <v-checkbox
              v-model="user.isAdmin"
              @change="updateAdminStatus(user)"
            ></v-checkbox>
          </td>
          <td>
            <v-list-item></v-list-item>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Pagination -->
    <v-pagination
      v-model="currentPage"
      :length="Math.ceil(filteredUsers.length / usersPerPage)"
      class="mt-4"
    ></v-pagination>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";

const users = ref([]);
const searchQuery = ref("");
const currentPage = ref(1);
const usersPerPage = ref(10);

// Fetch users from Firestore
onMounted(async () => {
  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    users.value = usersSnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
  }
});

// Computed property for filtered and paginated users
const filteredUsers = computed(() => {
  let filtered = users.value.filter((user) => {
    // Filter logic based on search query (displayName or email)
    const displayName = user.displayName ? user.displayName.toLowerCase() : "";
    const email = user.email ? user.email.toLowerCase() : "";
    return (
      displayName.includes(searchQuery.value.toLowerCase()) ||
      email.includes(searchQuery.value.toLowerCase())
    );
  });

  const startIndex = (currentPage.value - 1) * usersPerPage.value;
  const endIndex = startIndex + usersPerPage.value;
  return filtered.slice(startIndex, endIndex);
});

// Reset to first page when search query changes
watch(searchQuery, () => {
  currentPage.value = 1;
});

// Update user's admin status in Firestore
const updateAdminStatus = async (user) => {
  try {
    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error("Error updating admin status:", error);
  }
};
</script>
