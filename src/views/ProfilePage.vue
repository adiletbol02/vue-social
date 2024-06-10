<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="6">
        <v-card class="pa-5">
          <!-- Profile Title -->
          <v-card-title class="text-h5 text-center" v-if="!isEditing">
            My Profile
            <!-- Edit Button (visible in non-editing mode) -->
            <v-btn @click="isEditing = true" color="primary" small>
              Edit
            </v-btn>
          </v-card-title>

          <!-- Edit Profile Title (visible in editing mode) -->
          <v-card-title class="text-h5 text-center" v-else>
            Edit Profile
          </v-card-title>

          <v-card-text>
            <!-- Profile Display Section -->
            <div v-if="!isEditing">
              <img
                :src="user.photoURL || 'default-profile.png'"
                alt="Profile Picture"
                class="profile-image"
              />
              <p><strong>Display Name:</strong> {{ user.displayName }}</p>
              <p><strong>Email:</strong> {{ user.email }}</p>
              <p><strong>Bio:</strong> {{ firestoreBio || "No bio yet." }}</p>
            </div>

            <!-- Profile Editing Form -->
            <v-form v-else @submit.prevent="updateProfile">
              <v-file-input
                v-model="profileImage"
                label="Profile Image"
                accept="image/*"
              ></v-file-input>
              <v-text-field
                v-model="displayName"
                label="Display Name"
                required
              ></v-text-field>
              <v-textarea v-model="bio" label="Bio" rows="3"></v-textarea>
              <v-btn type="submit" color="primary" :disabled="loading">
                Save Changes
              </v-btn>
              <v-btn @click="cancel" color="secondary" :disabled="loading">
                Cancel
              </v-btn>
              <div v-if="errorMessage" class="text-error">
                {{ errorMessage }}
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { getAuth, updateProfile as updateFirebaseUser } from "firebase/auth";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "vue-router";

const router = useRouter();
const auth = getAuth();
const storage = getStorage();
const db = getFirestore();

// Refs for component state and data
const isEditing = ref(false);
const profileImage = ref(null);
const displayName = ref("");
const bio = ref("");
const loading = ref(false);
const errorMessage = ref(null);
const firestoreBio = ref(null);
const user = ref(auth.currentUser);

onMounted(async () => {
  if (user.value) {
    await fetchFirestoreData();
  }
  // Fetch user data from Firestore
  const userDocRef = doc(db, "users", user.value.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    displayName.value = userData.displayName || "";
    user.value.bio = userData.bio || "";
  } else {
    console.warn("User document not found in Firestore!");
  }
});

// Fetch firestore data function
const fetchFirestoreData = async () => {
  const userDocRef = doc(db, "users", user.value.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    displayName.value = userData.displayName || "";
    firestoreBio.value = userData.bio || "";
  } else {
    console.warn("User document not found in Firestore!");
  }
};

// Watch for changes to 'isEditing' and update the bio if needed
watch(isEditing, (newVal) => {
  if (newVal) {
    bio.value = firestoreBio.value || "";
  }
});

// Update profile function
const updateProfile = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    const user = auth.currentUser;
    const updates = {};
    const userDocRef = doc(db, "users", user.uid);

    // Handle profile image upload
    if (profileImage.value) {
      const imageRef = storageRef(storage, `profile-images/${user.uid}`);
      await uploadBytes(imageRef, profileImage.value);
      const downloadURL = await getDownloadURL(imageRef);
      updates.photoURL = downloadURL;
    }

    // Handle display name update
    if (displayName.value !== user.displayName) {
      updates.displayName = displayName.value;

      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const currentUsername = userDocSnap.data().displayName;

        // Update username-to-UID mapping
        await deleteDoc(doc(db, "usernames", currentUsername));

        await setDoc(doc(db, "usernames", displayName.value), {
          uid: user.uid,
        });
      }
    }

    // Update Firebase Authentication profile and Firestore document
    await Promise.all([
      updateFirebaseUser(user, updates),
      updateDoc(userDocRef, {
        displayName: displayName.value,
        bio: bio.value,
        ...(profileImage.value && { photoURL: updates.photoURL }),
      }),
    ]);

    // Update local data after successful update
    firestoreBio.value = bio.value;

    if (updates.photoURL && user.value) {
      user.value.photoURL = updates.photoURL;
    }

    router.push("/vue-social/profile");
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

// Cancel edit mode, revert changes
const cancel = () => {
  isEditing.value = false;
  displayName.value = user.value.displayName || "";
  bio.value = user.value.bio || "";
  profileImage.value = null;
};
</script>

<style scoped>
.profile-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 16px;
}
</style>
