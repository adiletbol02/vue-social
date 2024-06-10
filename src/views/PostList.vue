<template>
  <v-container>
    <!-- Fixed Header for Post Creation Form (only for admins in 'news' mode) -->
    <v-container
      v-if="!isNewsMode || (isNewsMode && currentUser.isAdmin)"
      class="fixed-header"
    >
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
                :rules="[rules.required, rules.maxLength]"
              ></v-text-field>
              <v-file-input
                v-model="newPostImage"
                label="Attach an image"
                outlined
                dense
                accept="image/*"
              ></v-file-input>
              <v-btn
                type="submit"
                color="primary"
                :disabled="isCreatingPost || !isValidPost"
              >
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
            <div v-if="isLoading">
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
            </div>
            <div v-else-if="fetchError">
              Error fetching posts: {{ fetchError }}
            </div>
            <PostContent
              v-else
              v-for="post in posts"
              :key="post.id"
              :post="post"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-container>
</template>

<script>
import { db, storage, auth } from "@/firebase.js";
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
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
  props: {
    isNewsMode: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const posts = ref([]);
    const isLoading = ref(true);
    const fetchError = ref(null);
    const newPostText = ref("");
    const newPostImage = ref(null);
    const isCreatingPost = ref(false);
    const showForm = ref(false);
    const currentUser = ref(auth.currentUser);
    const users = ref({}); // Store users data

    // Input validation rules
    const rules = {
      required: (value) => !!value || "This field is required",
      maxLength: (value) => value.length <= 200 || "Max 200 characters",
    };

    const isValidPost = computed(() => {
      return newPostText.value.trim() !== "" && newPostText.value.length <= 200;
    });

    // Function to fetch posts (updated to handle news mode)
    const fetchPosts = async () => {
      try {
        isLoading.value = true;
        fetchError.value = null;

        const collectionName = props.isNewsMode ? "news" : "posts";
        const postsCollection = collection(db, collectionName);
        const q = query(postsCollection, orderBy("createdAt", "desc"));

        // Unsubscribe from previous listener (if any) before creating a new one
        if (unsubscribePosts) {
          unsubscribePosts();
        }

        unsubscribePosts = onSnapshot(
          q,
          (querySnapshot) => {
            posts.value = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            isLoading.value = false;
          },
          (error) => {
            fetchError.value = error.message;
            isLoading.value = false;
          }
        );
      } catch (error) {
        console.error(
          `Error fetching ${props.isNewsMode ? "news" : "posts"}:`,
          error
        );
        fetchError.value = error.message;
        isLoading.value = false;
      }
    };

    let unsubscribePosts; // Variable to store the unsubscribe function

    onMounted(() => {
      fetchPosts();

      // Fetch and store user data
      const usersCollection = collection(db, "users");
      const unsubscribeUsers = onSnapshot(
        usersCollection,
        (querySnapshot) => {
          querySnapshot.forEach((doc) => {
            users.value[doc.id] = doc.data();
          });
        },
        (error) => {
          console.error("Error fetching users:", error);
        }
      );

      onBeforeUnmount(() => {
        if (unsubscribePosts) unsubscribePosts(); // Unsubscribe when component is unmounted
        unsubscribeUsers();
      });
    });

    // ... (rest of the component code: createPost, etc.)
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

    return {
      // ... other data and methods
      posts,
      isLoading,
      fetchError,
      newPostText,
      newPostImage,
      isCreatingPost,
      showForm,
      currentUser,
      users,
      createPost,
      rules,
      isValidPost,
    };
  },
};
</script>
