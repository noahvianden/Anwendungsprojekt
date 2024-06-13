<template>
  <div class="main">
    <city-map ref="cityMap" @start-navigation="startNavigation"/>
  </div>
</template>

<script>
import CityMap from './CityMap.vue';

export default {
  components: {
    CityMap,
  },
  methods: {
    forwardUpdateCoordinates(cityName) {
      this.$refs.cityMap.updateCoordinates(cityName);
    },
    startNavigation(name){
      this.$emit('start-navigation', name);
      this.$emit('show-rating', name);
    },
    addPoints(points){
      this.$emit('add-points', points);
    }
  },
};
</script>
  
<style scoped>
.main {
  flex: 1;
  margin: 30px;
  /*background-image: url('@/assets/backgroundImage3.png');
  background-size: cover; /* ensures the image covers the entire container */
  background-position: center; /* centers the image */
  background-color: rgb(226, 112, 112);
  border-radius: var(--border-radius);
  box-shadow: 4px 8px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
}

.main:hover {
  transform: scale(1.03);
}
</style>
