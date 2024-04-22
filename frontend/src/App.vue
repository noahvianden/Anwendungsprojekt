<template>
  <div class="container">
    <left-sidebar @update-coordinates="handleUpdateCoordinates" />
    <main-content ref="mainContent" />
    <right-sidebar />
  </div>
</template>

<script>
import LeftSidebar from './components/LeftSidebar.vue';
import MainContent from './components/MainContent.vue';
import RightSidebar from './components/RightSidebar.vue';

export default {
  components: {
    LeftSidebar,
    MainContent,
    RightSidebar,
  },
  methods: {
    handleUpdateCoordinates(data) {
      this.$refs.mainContent.forwardUpdateCoordinates(data);
    },
  },
};
</script>

<style scoped>
.container {
  display: flex;
}
</style>
