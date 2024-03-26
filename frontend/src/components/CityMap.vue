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
L.Util.falseFn = function() {}; // Leere Funktion, um Fehlermeldungen zu ignorieren

L.Util.error = function(message) {
  // Eigene Fehlerbehandlung implementieren, z.B. Konsolenmeldung oder Logging
  console.warn('[Leaflet Fehler]: ' + message);
};

L.Util.warn = function(message) {
  // Eigene Warnungsbehandlung implementieren, z.B. Konsolenmeldung oder Logging
  console.info('[Leaflet Warnung]: ' + message);
};

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import DuesseldorfDistricts from '@/assets/DuesseldorfDistricts.geojson';
// import DuesseldorfPlaces from '@/assets/DuesseldorfPlaces.json';
import markerIcon from '@/assets/marker-icon.png';

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
            zoomControl: true,
            zoomAnimation: false,
            attributionControl: false,
            dragging: true,
            touchZoom: true,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
          });
        }

        const boundary = await this.getCityBoundsGeoJSON();
        console.log(boundary)

        L.TileLayer.BoundaryCanvas('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
          boundary: boundary,
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
              try {
                this.map.eachLayer(layer => {
                    // Überprüfen, ob das Layer ein Marker ist und ob es sich um einen Restaurantmarker handelt
                    if (layer instanceof L.Marker && layer.options.icon.options.iconUrl === markerIcon) {
                      this.map.removeLayer(layer); // Entferne den Marker von der Karte
                    }
                });  
                if (!isZoomed) {
                  console.log(layer.getBounds(), { padding: [-500, -500] });
                  this.map.fitBounds(layer.getBounds());
                  const clickedDistrictCoordinates = layer.getBounds().getCenter(); // Koordinaten des geklickten Stadtteils
                  this.fetchRestaurantData(clickedDistrictCoordinates.lat, clickedDistrictCoordinates.lng);
                  isZoomed = true;
                } else {
                  this.map.fitBounds(this.cityBoundsLayer.getBounds());   
                  isZoomed = false;
                }
              } catch (error) {
                console.error('Fehler beim Klicken auf den Layer:', error);
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

    async fetchRestaurantData(latitude, longitude) {
      try {
        const response = await axios.get('http://localhost:3000/places', {
          params: {
            latitude,
            longitude
          }
        });

        this.restaurants = response.data.results; // Speichere die Restaurantdaten im Datenobjekt
        this.addRestaurantMarkers();
      } catch (error) {
        console.error('Fehler beim Abrufen der Restaurantdaten:', error);
      }
    },

    addRestaurantMarkers() {
      if (Array.isArray(this.restaurants)) {
        this.restaurants.forEach(restaurant => {
          const lat = restaurant.geometry.location.lat;
          const lon = restaurant.geometry.location.lng;
          // Füge den Marker nur hinzu, wenn ein Bezirk gezoomt ist
          // Annahme: Zoomlevel zum Anzeigen der Marker ist 12
          const customIcon = L.icon({
            iconUrl: markerIcon,
            iconSize: [19, 25.6],
            iconAnchor: [12, 41],
            popupAnchor: [0, -41]
          });

          L.marker([lat, lon], { icon: customIcon })
            .bindPopup(restaurant.name)
            .addTo(this.map);
        });
      } else {
        console.error('Die Restaurantdaten sind kein Array.');
      }
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
