<template>
  <div id="app" class="app-container">
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

<style>
.app-container {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .app-container {
    flex-direction: row;
  }
}
:root {
  --primary-color: white;
  --secondary-color: #75C9B7;
  --background-color: #ABD699;
  --text-color: #343A40;
  --border-radius: 15px;
}

body {
  margin: 0;
  font-family: 'Arial', sans-serif;
  background-color: var(--background-color);  
  color: var(--text-color);
}
</style>
