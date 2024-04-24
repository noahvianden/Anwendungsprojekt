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
    startNavigation(address){
      this.$emit('start-navigation', address);
    }
  },
};
</script>

<style scoped>
.main {
  flex: 2;
  border: 1px solid black;
  padding: 10px;
}
</style>
