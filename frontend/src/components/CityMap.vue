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
import DuesseldorfDistricts from '@/assets/DuesseldorfDistricts.geojson'; 

export default {
  name: 'MapComponent',
  data() {
    return {
      map: null,
      cityName: 'Düsseldorf',
      cityBoundsLayer: null,
      neighborhoodLayer: null,
    };
  },
  async mounted() {
    await this.initMap();
  },
  methods: {
    async initMap() {
      await this.updateMap();
    },

    async updateCoordinates() {
      await this.updateMap();
    },

    async updateMap() {
      const coordinates = await this.geocodeCity(this.cityName);
      if (!coordinates) {
        console.error('Koordinaten für die angegebene Stadt konnten nicht gefunden werden.');
        return;
      }
      
      if (this.map) {
        this.map.remove();
      }

      this.map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
      }).setView(coordinates, 11);

      const cityBoundsGeoJSON = await this.getCityBoundsGeoJSON(this.cityName);
      if (cityBoundsGeoJSON) {
        this.cityBoundsLayer = L.geoJSON(cityBoundsGeoJSON).addTo(this.map);
        this.cityBoundsLayer.setStyle({
          fillColor: 'transparent',
          color: 'black',
          weight: 4
        });
      } else {
        console.error('Fehler beim Abrufen der Stadtgrenzen.');
      }

      this.neighborhoodLayer = L.geoJSON(DuesseldorfDistricts, {
        onEachFeature: (feature, layer) => {
          layer.bindTooltip(feature.properties.Name, {
            permanent: false,
            className: 'my-label',
            direction: 'auto'
          });
        }
      }).addTo(this.map);

      this.neighborhoodLayer.setStyle({
        fillColor: 'transparent',
        color: 'gray',
        weight: 2
      });

      this.map.fitBounds(this.cityBoundsLayer.getBounds());
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
        console.error('Fehler beim Geocoding der Stadt:', error);
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
        console.error('Fehler beim Abrufen der Stadtgrenzen:', error);
        return null;
      }
    },

    showDistrictNamePopup(event, districtName) {
      alert(`District Name: ${districtName}`);
    }
  }
};
</script>

<style>
.map-container {
  display: flex;
  flex-direction: row;
  height: 90vh;
  width: 95%;
  margin-left: 1%;
}

#map {
  margin-left: 2%;
  width: 100%;
  height: 100%;
}

.my-label {
  background-color: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 5px;
  padding: 5px;
  font-size: 12px;
  color: black;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
