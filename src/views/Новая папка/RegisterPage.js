<template>
  <v-card class="mx-auto" max-width="344" title="User Registration">
    <v-container>
      <v-text-field
        v-model="email"
        color="primary"
        label="Email"
        :error-messages="emailError"
        variant="underlined"
      ></v-text-field>

      <v-text-field
        v-model="password"
        type="password"
        color="primary"
        label="Password"
        placeholder="Enter your password"
        variant="underlined"
        :error-messages="passwordError"
      ></v-text-field>

      <v-text-field
        v-model="username"
        color="primary"
        label="Username"
        :error-messages="usernameError"
        variant="underlined"
      ></v-text-field>
    </v-container>

    <v-divider></v-divider>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="success" :loading="loading" @click="register">
        Complete Registration
        <v-icon icon="mdi-chevron-right" end></v-icon>
      </v-btn>
    </v-card-actions>

    <div class="text-center mt-2">
      <router-link :to="{ name: 'SignIn' }">
        Already have an account? Sign in
      </router-link>
    </div>

    <v-divider class="mt-4"></v-divider>

    <v-card-actions class="mt-4">
      <v-icon icon="mdi-google"></v-icon>
      <v-btn @click="signInWithGoogle">Sign Up with Google</v-btn>
    </v-card-actions>

    <v-card-actions>
      <v-icon icon="mdi-microsoft"></v-icon>
      <v-btn @click="signInWithMicrosoft">Sign Up with Microsoft</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref } from "vue";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "vue-router";

const db = getFirestore();
const auth = getAuth();
const router = useRouter();

// Refs for form data, loading state, and error messages
const email = ref("");
const password = ref("");
const username = ref("");
const loading = ref(false);
const emailError = ref(null);
const passwordError = ref(null);
const usernameError = ref(null);

// Register function
const register = async () => {
  // Reset error messages
  emailError.value = null;
  passwordError.value = null;
  usernameError.value = null;
  loading.value = true;

  try {
    // Check if the username is already taken
    const usernameDocRef = doc(db, "usernames", username.value);
    const usernameDocSnap = await getDoc(usernameDocRef);

    if (usernameDocSnap.exists()) {
      usernameError.value = "Username is already taken.";
      loading.value = false;
      return;
    }

    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    const user = userCredential.user;

    // Update the user's profile with the chosen username
    await updateProfile(user, {
      displayName: username.value,
    });

    // Store user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      displayName: username.value,
      email: email.value,
      bio: "",
      photoURL: null,
      isAdmin: false,
    });

    // Store username-to-UID mapping
    await setDoc(usernameDocRef, {
      uid: user.uid,
    });

    // Redirect to Home after successful registration
    router.push({ name: "Home" });
  } catch (error) {
    // Handle different registration errors and display appropriate messages
    if (error.code === "auth/email-already-in-use") {
      emailError.value = "Email is already in use.";
    } else if (error.code === "auth/invalid-email") {
      emailError.value = "Invalid email format.";
    } else if (error.code === "auth/weak-password") {
      passwordError.value = "Password is too weak.";
    } else {
      alert("Error registering: " + error.message);
    }
  } finally {
    loading.value = false;
  }
};

// Sign up with Google function (similar to SignIn)
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(getAuth(), provider);
    const user = result.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const displayName = user.displayName ? user.displayName : user.email;

      await setDoc(userDocRef, {
        displayName: displayName,
        bio: "",
        photoURL: user.photoURL,
        isAdmin: false,
        email: user.email,
      });

      const newUserDocSnap = await getDoc(userDocRef);
      const userData = newUserDocSnap.data();
      user.isAdmin = userData.isAdmin;

      // Store username-to-UID mapping
      await setDoc(doc(db, "usernames", user.displayName), {
        uid: user.uid,
      });
    } else {
      const userData = userDocSnap.data();
      user.isAdmin = userData.isAdmin;
    }

    router.push({ name: "Home" });
  } catch (error) {
    console.error("Google sign-up error:", error);
    alert("Error signing up with Google: " + error.message);
  }
};

// Sign up with Microsoft function (similar to SignIn)
const signInWithMicrosoft = () => {
  const provider = new OAuthProvider("microsoft.com");

  signInWithPopup(getAuth(), provider)
    .then(async (result) => {
      const user = result.user;
      console.log("Microsoft sign-in successful:", user);

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          displayName: user.displayName,
          bio: "",
          isAdmin: false,
        });
      }

      const userData = userDocSnap.data();
      user.isAdmin = userData.isAdmin;

      // Redirect to Home after successful sign-in/up
      router.push({ name: "Home" });
    })
    .catch((error) => {
      console.error("Microsoft sign-in error:", error);
      alert("Error signing in with Microsoft: " + error.message);
    });
};
</script>
