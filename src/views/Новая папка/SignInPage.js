<template>
  <v-card class="mx-auto" max-width="344" title="Sign In">
    <v-container>
      <v-text-field
        v-model="email"
        color="primary"
        label="Email"
        variant="underlined"
        :error-messages="emailError"
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
    </v-container>

    <v-divider></v-divider>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="success" @click="signIn">
        Sign In
        <v-icon icon="mdi-chevron-right" end></v-icon>
      </v-btn>
    </v-card-actions>

    <div class="text-center mt-2">
      <router-link :to="{ name: 'Register' }"
        >Don't have an account? Register</router-link
      >
    </div>

    <v-divider class="mt-4"></v-divider>

    <v-card-actions class="mt-4">
      <v-icon icon="mdi-google"></v-icon>
      <v-btn @click="signInWithGoogle">Sign In with Google</v-btn>
    </v-card-actions>

    <v-card-actions>
      <v-icon icon="mdi-microsoft"></v-icon>
      <v-btn @click="signInWithMicrosoft">Sign In with Microsoft</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref } from "vue";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
} from "firebase/auth";
import { useRouter } from "vue-router";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const db = getFirestore();
const router = useRouter();

// Refs for email, password, and error messages
const email = ref("");
const password = ref("");
const emailError = ref(null);
const passwordError = ref(null);

// Sign in with email and password function
const signIn = async () => {
  // Reset error messages
  emailError.value = null;
  passwordError.value = null;

  try {
    const userCredential = await signInWithEmailAndPassword(
      getAuth(),
      email.value,
      password.value
    );
    const user = userCredential.user;

    // Fetch user data from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // If user document exists, set isAdmin property
    if (userDocSnap.exists()) {
      user.isAdmin = userDocSnap.data().isAdmin;
    } else {
      console.error("User document not found in Firestore");
    }

    // Redirect to Home after successful sign in
    router.push({ name: "Home" });
  } catch (error) {
    console.log("Error during sign in:", error.code);

    // Handle different sign-in errors and display appropriate messages
    if (error.code === "auth/invalid-email") {
      emailError.value = "Invalid email format.";
    } else if (error.code === "auth/user-not-found") {
      emailError.value = "No account with that email was found.";
    } else if (error.code === "auth/wrong-password") {
      passwordError.value = "Incorrect password.";
    } else {
      console.error("Firebase sign-in error:", error);
      passwordError.value = "Incorrect email or password";
    }
  }
};

// Sign in with Google function
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(getAuth(), provider);
    const user = result.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // If the user document doesn't exist, create it
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
      // User document exists, fetch isAdmin status
      const userData = userDocSnap.data();
      user.isAdmin = userData.isAdmin;
    }

    // Redirect to Home after successful sign-in
    router.push({ name: "Home" });
  } catch (error) {
    console.error("Google sign-up error:", error);
    alert("Error signing up with Google: " + error.message);
  }
};

// Sign in with Microsoft function
const signInWithMicrosoft = () => {
  const provider = new OAuthProvider("microsoft.com");

  signInWithPopup(getAuth(), provider)
    .then(async (result) => {
      const user = result.user;
      console.log("Microsoft sign-in successful:", user);

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // If user document doesn't exist, create it
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          displayName: user.displayName,
          bio: "",
          isAdmin: false,
        });
      }

      // Redirect to Home after successful sign-in
      router.push({ name: "Home" });
    })
    .catch((error) => {
      console.error("Microsoft sign-in error:", error);
      alert("Error signing in with Microsoft: " + error.message);
    });
};
</script>
