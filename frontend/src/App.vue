<template>
  <div class="container">
    <left-sidebar @update-coordinates="handleUpdateCoordinates" />
    <main-content ref="mainContent" @start-navigation="startNavigation" />
    <right-sidebar ref="rightSidebar" />
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
    startNavigation(data) {
      console.log("Received and forwarded by App");
      this.$refs.rightSidebar.showNavigation(data);
    },
  },
};
</script>

<style scoped>
.container {
  display: flex;
}
</style>
