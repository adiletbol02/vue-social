<template>
  <v-container>
    <!-- Fixed Header for Post Creation Form -->
    <v-container class="fixed-header">
      <v-row>
        <v-col>
          <v-card style="text-align: center" class="pa-4">
            <!-- Create Post Button (visible to admins when form is hidden) -->
            <v-btn
              v-if="!showForm && currentUser && currentUser.isAdmin"
              color="primary"
              @click="showForm = true"
            >
              Create Post
            </v-btn>
            <!-- Post Creation Form -->
            <v-form
              v-if="showForm"
              @submit.prevent="createPost"
              class="post-form"
            >
              <v-text-field
                v-model="newPostText"
                label="What's on your mind?"
                outlined
                dense
              ></v-text-field>
              <v-file-input
                v-model="newPostImage"
                label="Attach an image"
                outlined
                dense
                accept="image/*"
              ></v-file-input>
              <!-- Post Submit Button -->
              <v-btn type="submit" color="primary" :disabled="isCreatingPost">
                {{ isCreatingPost ? "Posting..." : "Post" }}
              </v-btn>
              <!-- Cancel Button for Post Form -->
              <v-btn text @click="showForm = false" class="cancel-btn">
                Cancel
              </v-btn>
            </v-form>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Main Content Area for News Posts -->
    <v-main>
      <v-container class="main-content">
        <v-row>
          <v-col>
            <div v-if="isLoading">Loading posts...</div>
            <div v-else-if="fetchError">
              Error fetching posts: {{ fetchError }}
            </div>
            <PostContent
              v-else
              v-for="post in news"
              :key="post.id"
              :post="post"
              :users="users"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-container>
</template>

<script>
import { db, storage, auth } from "@/firebase.js";
import { ref, onMounted, onBeforeUnmount } from "vue";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  uploadBytes,
  getDownloadURL,
  ref as storageRef,
} from "firebase/storage";
import PostContent from "./PostContent.vue";

export default {
  components: {
    PostContent,
  },
  setup() {
    // Refs for component data and state
    const news = ref([]);
    const users = ref({});
    const isLoading = ref(true);
    const fetchError = ref(null);
    const newPostText = ref("");
    const newPostImage = ref(null);
    const isCreatingPost = ref(false);
    const showForm = ref(false);
    const currentUser = ref(auth.currentUser);

    // Create Post Function
    const createPost = async () => {
      if (newPostText.value.trim() === "") {
        alert("Post text cannot be empty");
        return;
      }

      isCreatingPost.value = true;

      try {
        let imageUrl = null;

        // Handle image upload (if any)
        if (newPostImage.value) {
          const imageRef = storageRef(
            storage,
            `news/${new Date().toISOString()}_${newPostImage.value.name}`
          );
          await uploadBytes(imageRef, newPostImage.value);
          imageUrl = await getDownloadURL(imageRef);
        }

        // Add new post data to Firestore
        await addDoc(collection(db, "news"), {
          text: newPostText.value,
          imageUrl: imageUrl,
          createdAt: serverTimestamp(),
          userId: auth.currentUser.uid,
          username: auth.currentUser.displayName,
          userPhotoURL: auth.currentUser.photoURL,
        });

        // Clear form fields after successful post creation
        newPostText.value = "";
        newPostImage.value = null;
      } catch (error) {
        console.error("Error creating post:", error);
        alert("Error creating post: " + error.message);
      } finally {
        isCreatingPost.value = false;
      }
    };

    onMounted(() => {
      // Fetch News Posts from Firestore
      const postsCollection = collection(db, "news");
      const q = query(postsCollection, orderBy("createdAt", "desc"));

      const unsubscribePosts = onSnapshot(
        q,
        (querySnapshot) => {
          console.log("Fetching posts...");
          if (querySnapshot.empty) {
            console.log("No posts found.");
          } else {
            news.value = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            console.log("Posts loaded:", news.value);
          }
          isLoading.value = false;
        },
        (error) => {
          fetchError.value = error.message;
          console.error("Error fetching posts:", error);
          isLoading.value = false;
        }
      );

      // Fetch User Data from Firestore
      const usersCollection = collection(db, "users");
      const unsubscribeUsers = onSnapshot(
        usersCollection,
        (querySnapshot) => {
          console.log("Fetching users...");
          querySnapshot.forEach((doc) => {
            users.value[doc.id] = doc.data();
          });
          console.log("Users loaded:", users.value);
        },
        (error) => {
          console.error("Error fetching users:", error);
        }
      );

      // Observe Authentication State Changes
      const unsubscribeAuth = auth.onAuthStateChanged((user) => {
        currentUser.value = user;
      });

      // Unsubscribe from listeners when component is unmounted
      onBeforeUnmount(() => {
        unsubscribePosts();
        unsubscribeUsers();
        unsubscribeAuth();
      });
    });

    return {
      news,
      users,
      isLoading,
      fetchError,
      newPostText,
      newPostImage,
      createPost,
      isCreatingPost,
      showForm,
      currentUser,
    };
  },
};
</script>

<style scoped>
.fixed-header {
  position: fixed;
  top: 50px;
  left: 0;
  right: 8;
  z-index: 10;
  background-color: white;
}

.post-form {
  display: flex;
  flex-direction: column;
}

.cancel-btn {
  margin-top: 10px;
}

.main-content {
  padding-top: 16px;
}
</style>
