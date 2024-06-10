import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const routes = [
  {
    path: "/vue-social",
    redirect: "/vue-social/sign-in",
  },
  {
    path: "/",
    redirect: "/vue-social/sign-in",
  },
  {
    path: "/vue-social/home",
    name: "Home",
    component: () => import("../views/HomePage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/vue-social/profile",
    name: "Profile",
    component: () => import("../views/ProfilePage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/vue-social/register",
    name: "Register",
    component: () => import("../views/RegisterPage.vue"),
  },
  {
    path: "/vue-social/sign-in",
    name: "SignIn",
    component: () => import("../views/SignInPage.vue"),
  },
  {
    path: "/vue-social/news",
    name: "News",
    component: () => import("../views/NewsPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/vue-social/admin",
    name: "Admin",
    component: () => import("../views/admin/AdminPanel.vue"),
    meta: {
      requiresAuth: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      getAuth(),
      (user) => {
        removeListener();
        resolve(user);
      },
      reject
    );
  });
};

router.beforeEach(async (to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (await getCurrentUser()) {
      next();
    } else {
      alert("you don't have access!");
      next({ name: "SignIn" });
    }
  } else {
    next();
  }
});

export default router;
