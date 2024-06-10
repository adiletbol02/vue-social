<template>
  <v-container>
    <!-- Fixed Header for Post Creation Form -->
    <v-container class="fixed-header">
      <v-row>
        <v-col>
          <v-card style="text-align: center" class="pa-4">
            <v-btn v-if="!showForm" color="primary" @click="showForm = true">
              Create Post
            </v-btn>
            <v-form v-else @submit.prevent="createPost" class="post-form">
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
              <v-btn type="submit" color="primary" :disabled="isCreatingPost">
                {{ isCreatingPost ? "Posting..." : "Post" }}
              </v-btn>
              <v-btn text @click="showForm = false" class="cancel-btn">
                Cancel
              </v-btn>
            </v-form>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

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
              v-for="post in posts"
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
    const posts = ref([]);
    const users = ref({});
    const isLoading = ref(true);
    const fetchError = ref(null);
    const newPostText = ref("");
    const newPostImage = ref(null);
    const isCreatingPost = ref(false);
    const showForm = ref(false);

    // Create Post Function (similar to NewsPage)
    const createPost = async () => {
      if (newPostText.value.trim() === "") {
        alert("Post text cannot be empty");
        return;
      }
      isCreatingPost.value = true;

      try {
        let imageUrl = null;
        if (newPostImage.value) {
          const imageRef = storageRef(
            storage,
            `posts/${new Date().toISOString()}_${newPostImage.value.name}`
          );
          await uploadBytes(imageRef, newPostImage.value);
          imageUrl = await getDownloadURL(imageRef);
        }

        await addDoc(collection(db, "posts"), {
          text: newPostText.value,
          imageUrl: imageUrl,
          createdAt: serverTimestamp(),
          userId: auth.currentUser.uid,
          username: auth.currentUser.displayName,
          userPhotoURL: auth.currentUser.photoURL,
        });

        // Clear input fields after posting
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
      const postsCollection = collection(db, "posts");
      const q = query(postsCollection, orderBy("createdAt", "desc"));

      const unsubscribePosts = onSnapshot(
        q,
        (querySnapshot) => {
          console.log("Fetching posts...");
          if (querySnapshot.empty) {
            console.log("No posts found.");
          } else {
            posts.value = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            console.log("Posts loaded:", posts.value);
          }
          isLoading.value = false;
        },
        (error) => {
          fetchError.value = error.message;
          console.error("Error fetching posts:", error);
          isLoading.value = false;
        }
      );

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

      onBeforeUnmount(() => {
        unsubscribePosts();
        unsubscribeUsers();
      });
    });

    return {
      posts,
      users,
      isLoading,
      fetchError,
      newPostText,
      newPostImage,
      createPost,
      isCreatingPost,
      showForm,
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
