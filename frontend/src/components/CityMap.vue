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
import axios from 'axios';

export default {  
  name: 'MapComponent',
  data() {
    return {
      map: null,
      cityName: 'Düsseldorf',
      cityBoundsLayer: null,
      neighborhoodLayer: null,
      restaurants: [],
    };
  },
  async mounted() {
    // Vor der Initialisierung sicherstellen, dass das map-Div im DOM vorhanden ist
    if (!document.getElementById('map')) {
      console.error('Das "map"-Div wurde im DOM nicht gefunden.');
      return;
    }

    await this.initMap();
    await this.fetchRestaurantData(); // Neue Zeile: Restaurants abrufen
    this.addRestaurantMarkers(); // Neue Zeile: Restaurantmarker hinzufügen
  },
  methods: {
    async initMap() {
      await this.updateMap();
    },

    async updateCoordinates() {
      await this.updateMap();
    },

    async updateMap() {
      try {
        const coordinates = await this.geocodeCity(this.cityName);
        if (!coordinates) {
          console.error('Koordinaten für die angegebene Stadt konnten nicht gefunden werden.');
          return;
        }

        if (!this.map) {
          this.map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
          });
        }

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png'
, {
          attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(this.map);

        if (this.cityBoundsLayer) {
          this.map.removeLayer(this.cityBoundsLayer);
        }

        const cityBoundsGeoJSON = await this.getCityBoundsGeoJSON(this.cityName);
        if (!cityBoundsGeoJSON) {
          console.warn('Stadtgrenzen konnten nicht abgerufen werden. Die Karte wird dennoch aktualisiert.');
        } else {
          this.cityBoundsLayer = L.geoJSON(cityBoundsGeoJSON).addTo(this.map);
          this.cityBoundsLayer.setStyle({
            fillColor: 'transparent',
            color: 'black',
            weight: 4
          });
        }

        if (this.neighborhoodLayer) {
          this.map.removeLayer(this.neighborhoodLayer);
        }

        this.neighborhoodLayer = L.geoJSON(DuesseldorfDistricts, {
          onEachFeature: (feature, layer) => {
            layer.bindTooltip(feature.properties.Name, {
                permanent: false,
                className: 'my-label',
                direction: 'auto'
            });
            let isZoomed = false;
            layer.on('click', () => {
                if (!isZoomed) {
                    this.map.fitBounds(layer.getBounds());
                    isZoomed = true;
                } else {
                    this.map.fitBounds(this.cityBoundsLayer.getBounds());
                    isZoomed = false;
                }
            });
        }
        }).addTo(this.map);

        this.neighborhoodLayer.setStyle({
          fillColor: 'transparent',
          color: 'gray',
          weight: 2
        });

        this.map.fitBounds(this.cityBoundsLayer.getBounds());
      } catch (error) {
        console.error('Fehler beim Aktualisieren der Karte:', error);
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
    
    async fetchRestaurantData() {
      try {
        const response = await axios.get(`http://localhost:3000/restaurants`, { // Ändern Sie die URL auf Ihren Proxy-Endpunkt
          params: {
            location: '51.2277,6.7735', // Koordinaten von Düsseldorf
            radius: 1000, // Radius in Metern
          }
        });
        this.restaurants = response.data.results.map(result => ({
          name: result.name,
          lat: result.geometry.location.lat,
          lon: result.geometry.location.lng
        }));
      } catch (error) {
        console.error('Fehler beim Abrufen der Restaurantdaten:', error);
      }
    },


    addRestaurantMarkers() {
      this.restaurants.forEach(restaurant => {
        L.marker([restaurant.lat, restaurant.lon])
          .bindPopup(restaurant.name)
          .addTo(this.map);
      });
    },
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
