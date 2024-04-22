<template>
  <div id="city-search">
    <form @submit.prevent="updateCoordinates">
      <label for="cityName">Stadtname:</label>
      <input type="text" id="cityName" v-model="cityName">
      <button type="submit">Aktualisieren</button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      cityName: 'Düsseldorf'
    };
  },
  methods: {
    // Emit the update-coordinates event with the city name
    updateCoordinates() {
      this.$emit('update-coordinates', this.cityName);
    }
  }
};
</script>

<style scoped>
#city-search {
  display: flex;
  flex-direction: row;
  justify-content: flex-start; /* Aligns content to the right */
}

form {
  display: flex;
  flex-direction: row;
  align-items: top;
}

input,
button {
  margin-left: 10px; /* Adds some space between elements */
}
</style>
