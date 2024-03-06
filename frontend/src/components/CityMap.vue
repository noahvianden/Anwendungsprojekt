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
import DuesseldorfDistricts from '@/assets/DuesseldorfDistricts.geojson'; // Importieren der GeoJSON-Datei

export default {
  name: 'MapComponent',
  data() {
    return {
      map: null,
      cityName: 'Düsseldorf', // Standard-Stadtname
      cityBoundsLayer: null, // Layer für die Stadtgrenzen
      neighborhoodLayer: null, // Layer für Stadtteile
    };
  },
  async mounted() {
    await this.initMap();
  },
  methods: {
    async initMap() {
      const coordinates = await this.geocodeCity(this.cityName);
      if (coordinates) {
        this.map = L.map('map', {
          zoomControl: false,
          attributionControl: false,
          dragging: false, // Deaktivieren von Drag-and-Drop
          touchZoom: false, // Deaktivieren von Zoom durch Berührung
          scrollWheelZoom: false, // Deaktivieren von Zoom durch Scrollen
          doubleClickZoom: false, // Deaktivieren von Zoom durch Doppelklick
          boxZoom: false,
        }).setView(coordinates, 11);

        //const cardType = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png';
        //L.tileLayer(cardType).addTo(this.map);

        const cityBoundsGeoJSON = await this.getCityBoundsGeoJSON(this.cityName);
        this.cityBoundsLayer = L.geoJSON(cityBoundsGeoJSON).addTo(this.map);
        
        this.neighborhoodLayer = L.geoJSON(DuesseldorfDistricts, {
          onEachFeature: (feature, layer) => {
            layer.bindTooltip(feature.properties.Name, {
              permanent: false,
              className: 'my-label',
              direction: 'auto'
            });
          }
        }).addTo(this.map);

        this.cityBoundsLayer.setStyle({
          fillColor: 'transparent',
          color: 'black',
          weight: 4
        });

        this.neighborhoodLayer.setStyle({
          fillColor: 'transparent',
          color: 'gray',
          weight: 2
        });

        this.map.fitBounds(this.cityBoundsLayer.getBounds());

      } else {
        console.error('Koordinaten für die angegebene Stadt konnten nicht gefunden werden.');
      }
    },

    async updateCoordinates() {
      const coordinates = await this.geocodeCity(this.cityName);
      if (coordinates && this.map) {
        if (this.cityBoundsLayer) {
          this.map.removeLayer(this.cityBoundsLayer);
        }
        if (this.neighborhoodLayer) {
          this.map.removeLayer(this.neighborhoodLayer);
        }

        const cityBoundsGeoJSON = await this.getCityBoundsGeoJSON(this.cityName);
        this.cityBoundsLayer = L.geoJSON(cityBoundsGeoJSON).addTo(this.map);

        this.neighborhoodLayer = L.geoJSON(DuesseldorfDistricts, {
          onEachFeature: (feature, layer) => {
            layer.bindTooltip(feature.properties.Name, {
              permanent: false,
              className: 'my-label',
              direction: 'auto'
            });
          }
        }).addTo(this.map);

        this.cityBoundsLayer.setStyle({
          fillColor: 'transparent',
          color: 'black',
          weight: 4
        });

        this.neighborhoodLayer.setStyle({
          fillColor: 'transparent',
          color: 'gray',
          weight: 2
        });

        this.map.fitBounds(this.cityBoundsLayer.getBounds());
      } else {
        console.error('Koordinaten für die angegebene Stadt konnten nicht gefunden werden.');
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

    // Zeigen Sie den Namen des Stadtteils in einem benutzerdefinierten Popup oder einem anderen UI-Element an
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

/* Benutzerdefinierte CSS für Labels */
.my-label {
  background-color: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 5px;
  padding: 5px;
  font-size: 12px;
  color: black;
  max-width: 100px; /* Maximale Breite des Labels */
  white-space: nowrap; /* Textüberlauf verhindern */
  overflow: hidden; /* Überlauf verstecken */
  text-overflow: ellipsis; /* Textabkürzung anzeigen */
}
</style>
