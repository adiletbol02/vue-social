<template>
  <v-card class="mb-3">
    <v-card-title class="d-flex align-center">
      <div v-if="user">
        <v-avatar class="mr-3">
          <!-- Display user's profile picture -->
          <img
            v-if="user.photoURL"
            :src="user.photoURL"
            alt="Profile Picture"
            class="avatar-img"
          />
          <!-- Display default profile picture if user doesn't have one -->
          <img
            v-else
            src="https://firebasestorage.googleapis.com/v0/b/vuesocial-5ebd2.appspot.com/o/system-images%2Faccount.png?alt=media&token=3d774fec-20ee-487d-a027-d01bc4a7b2e0"
            alt="Profile Picture"
            class="avatar-img"
          />
        </v-avatar>
        <div>
          <div class="username">
            {{ user.displayName || "Unknown User" }}
          </div>
          <div class="text--secondary">
            {{ postTime }}
          </div>
        </div>
      </div>
    </v-card-title>

    <!-- Post Text Content -->
    <v-card-text class="post-text">
      {{ post.text }}
    </v-card-text>

    <!-- Post Image (if available) -->
    <v-img
      v-if="post.imageUrl"
      :src="post.imageUrl"
      height="350px"
      class="post-image"
      contain
    />
  </v-card>
</template>

<script>
import { computed, ref, onMounted } from "vue";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebase.js";

export default {
  props: {
    post: Object,
    users: Object,
  },
  setup(props) {
    const user = ref(null);

    onMounted(async () => {
      try {
        // Fetch user data from Firestore based on userId from the post
        const userDocRef = doc(db, "users", props.post.userId);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          user.value = userDocSnapshot.data();
        } else {
          console.log("User document not found.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    });

    // Computed property to format post time
    const postTime = computed(() => {
      if (!props.post.createdAt) return "Unknown time";

      const date = props.post.createdAt.toDate();
      return date.toLocaleString();
    });

    return {
      user,
      postTime,
    };
  },
};
</script>

<style scoped>
.text--secondary {
  font-size: 0.8em;
  color: grey;
}

.username {
  font-size: 1rem;
}

.post-text {
  font-size: 1.1rem;
}
.post-image {
  max-width: 100%;
}
.avatar-img {
  width: 32px;
  height: 32px;
  object-fit: cover;
}
</style>
