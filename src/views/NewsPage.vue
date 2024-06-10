<template>
  <PostList :isNewsMode="true" />
</template>

<script>
import PostList from "./PostList.vue";

export default {
  components: {
    PostList,
  },
};
</script>
