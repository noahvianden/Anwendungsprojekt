<template>
  <div class="map-container">
    <form @submit.prevent="updateCoordinates">
      <label for="cityName">City Name:</label>
      <input type="text" id="cityName" v-model="cityName">
      <button type="submit">Update</button>
    </form>
    <div id="map"></div>
  </div>
</template>

<script>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default {
  name: 'MapComponent',
  data() {
    return {
      map: null,
      cityName: 'Berlin', // Default city name
      cityBoundsLayer: null, // Layer for city bounds
    };
  },
  async mounted() {
    if (!this.mapInitialized) {
      await this.initMap();
      this.mapInitialized = true;
    }
  },
  methods: {
    async initMap() {
      const coordinates = await this.geocodeCity(this.cityName);
      if (coordinates) {
        // Get the city bounds as GeoJSON
        const cityBoundsGeoJSON = await this.getCityBoundsGeoJSON(this.cityName);

        this.map = L.map('map', {
        }).setView(coordinates, 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        // Add the city bounds as an overlay to the map
        this.cityBoundsLayer = L.geoJSON(cityBoundsGeoJSON).addTo(this.map);
        
        // Set the maximum bounds of the map to the city bounds
        this.map.setMaxBounds(this.cityBoundsLayer.getBounds());
        
        L.marker(coordinates).addTo(this.map)
          .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
          .openPopup();
      } else {
        console.error('Coordinates for the specified city could not be found.');
      }
    },
    async updateCoordinates() {
      const coordinates = await this.geocodeCity(this.cityName);
      if (coordinates && this.map) {
        // Remove previous city bounds layer
        if (this.cityBoundsLayer) {
          this.map.removeLayer(this.cityBoundsLayer);
        }
        
        // Get the city bounds as GeoJSON for the new city
        const cityBoundsGeoJSON = await this.getCityBoundsGeoJSON(this.cityName);
        
        // Add the new city bounds layer to the map
        this.cityBoundsLayer = L.geoJSON(cityBoundsGeoJSON).addTo(this.map);
        this.map.fitBounds(this.cityBoundsLayer.getBounds());
        
        // Set the maximum bounds of the map to the city bounds
        this.map.setMaxBounds(this.cityBoundsLayer.getBounds());
        
        // Set the new center of the map
        this.map.setView(coordinates);
        
        // Add marker at the new coordinates
        L.marker(coordinates).addTo(this.map)
          .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
          .openPopup();
      } else {
        console.error('Coordinates for the specified city could not be found.');
      }
    },
    async geocodeCity(cityName) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${cityName}`);
        const data = await response.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        } else {
          return null;
        }
      } catch (error) {
        console.error('Error geocoding city:', error);
        return null;
      }
    },
    async getCityBoundsGeoJSON(cityName) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${cityName}&limit=1&polygon_geojson=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          return data[0].geojson;
        } else {
          return null;
        }
      } catch (error) {
        console.error('Error getting city bounds:', error);
        return null;
      }
    },
  },
};
</script>

<style>
.map-container {
  display: flex;
  flex-direction: row;
  height: 90vh; /* 80% der Bildschirmhöhe */
  width: 95%;
  margin-left: 1%;
}

#map {
  margin-left: 2%;
  width: 100%;
  height: 100%;
}
</style>
