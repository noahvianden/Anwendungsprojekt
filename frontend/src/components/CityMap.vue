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
import DuesseldorfDistricts from '@/assets/DuesseldorfDistricts.geojson';
import DuesseldorfPlaces from '@/assets/DuesseldorfPlaces.json';

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
        zoomAnimation: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
      });
    }

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
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

    try {
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
              if (!isZoomed) {
                this.map.fitBounds(layer.getBounds());
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
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Stadtteillayers:', error);
    }

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
        // Überprüfen, ob lokale Daten vorhanden sind
        this.restaurants = DuesseldorfPlaces.results; // Ändern Sie diese Zeile
        if (this.restaurants) {
          console.log(this.restaurants)
          this.addRestaurantMarkers();
        } else {
          console.warn('Keine lokalen Restaurantdaten gefunden. Laden von externen Quellen...');
          // Wenn keine lokalen Daten vorhanden sind, fügen Sie den Code zum Abrufen von externen Daten hier ein
        }
      } catch (error) {
        console.error('Fehler beim Abrufen der Restaurantdaten:', error);
      }
    },

    addRestaurantMarkers() {
      if (Array.isArray(this.restaurants)) {
        console.log("DAS ASGAS OLGVASNF")
        this.restaurants.forEach(restaurant => {
          const lat = restaurant.geometry.location.lat;
          const lon = restaurant.geometry.location.lng;
          var infoContent = "<b>" + restaurant.name + "</b><br>" +
                        "Adresse: " + restaurant.vicinity + "<br>" +
                        "Öffnungszeiten: " + restaurant.opening_hours + "<br>" +
                        "Navigation mit Rechtsklick starten";
          var popupOnClick = L.popup().setContent(infoContent);
          var popupOnMouseover = L.popup().setContent(restaurant.name);
          var iconR = L.icon({
              iconUrl: require('@/assets/restaurant.png'),
              iconSize: [15, 15]
          });
          var markerR = L.marker([lat, lon], { icon: iconR })
          .bindPopup(infoContent)
          .addTo(this.map);

          // Ereignis 'mouseover' zum Marker hinzufügen, um Popup beim Hovern anzuzeigen
          markerR.on('mouseover', function() {
              markerR.bindPopup(popupOnMouseover).openPopup();
          });

          // Ereignis 'mouseout' zum Marker hinzufügen, um Popup beim Verlassen zu schließen
          markerR.on('mouseout', function() {
              markerR.closePopup();
          });

          // Ereignis 'click' zum Marker hinzufügen, um Popup beim Klicken anzuzeigen
          markerR.on('click', function() {
              markerR.bindPopup(popupOnClick).openPopup();});
          
          markerR.on('contextmenu', () => {
              var markerLatLng = markerR.getLatLng();
              var destinationAddress = markerLatLng.lat + "," + markerLatLng.lng;
              this.startNavigationTo(destinationAddress);
          });

        });
      } else {
        console.error('Die Restaurantdaten sind kein Array.');
      }
    },

    startNavigationTo(address) {
    // Ersetze 'address' durch die Adresse oder Koordinaten des Ziels
    var url = 'https://www.google.com/maps/dir//' + encodeURIComponent(address);
    window.open(url, '_blank');
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
