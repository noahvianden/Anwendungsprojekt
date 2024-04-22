<template>
  <div class="main">
    <city-map ref="cityMap"/>
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
