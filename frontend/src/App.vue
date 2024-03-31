<template>
  <div class="container">
    <div class="component-wrapper">
      <CitySearch @update-coordinates="updateCoordinates" />
    </div>
    <div class="component-wrapper city-map-wrapper">
      <CityMap ref="cityMap" />
    </div>
  </div>
</template>

<script>
import CityMap from './components/CityMap.vue';
import CitySearch from './components/CitySearch.vue';

export default {
  name: 'App',
  components: {
    CityMap,
    CitySearch
  },
  methods: {
    updateCoordinates(cityName) {
      // Call the updateCoordinates method of CityMap component
      this.$refs.cityMap.updateCoordinates(cityName);
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 10px;
}

.container {
  display: flex;
  justify-content: space-between;
}

.component-wrapper {
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 5px;
}

.city-map-wrapper {
  flex: 1;
}
</style>
