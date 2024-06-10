<template>
  <PostList :isNewsMode="false" />
</template>

<script>
import PostList from "./PostList.vue";

export default {
  components: {
    PostList,
  },
};
</script>
