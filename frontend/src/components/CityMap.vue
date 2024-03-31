<template>
    <!-- Div für die Karte -->
    <div id="map"></div>
</template>

<script>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import DuesseldorfDistricts from '@/assets/DuesseldorfDistricts.geojson';
import BerlinDistricts from '@/assets/BerlinDistricts.geojson';
import RestaurantMarkerIcon from '@/assets/restaurant.png';
import 'leaflet-boundary-canvas';

export default {
  name: 'MapComponent',
  components: {
  },
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
    await this.initMap();
  },
  methods: {
    // Initialisierung der Karte beim Laden der Komponente
    async initMap() {
      await this.updateMap();
    },

    async updateCoordinates(cityName) {
      // Update the cityName property
      this.cityName = cityName;
      // Call the updateMap method to update the map
      await this.updateMap();
    },

    // Methode zum Aktualisieren der Karte
    async updateMap() {
      try {

        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        if (this.cityBoundsLayer) {
            this.cityBoundsLayer.remove();
            this.cityBoundsLayer = null;
        }
        if (this.neighborhoodLayer) {
            this.neighborhoodLayer.remove();
            this.neighborhoodLayer = null;
        }

        // Koordinaten der Stadt abrufen
        const coordinates = await this.geocodeCity(this.cityName);
        if (!coordinates) {
          console.error('Koordinaten für die angegebene Stadt konnten nicht gefunden werden.');
          return;
        }

        // Karte initialisieren, wenn noch nicht vorhanden
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

        // Stadtgrenzen laden und zur Karte hinzufügen
        const cityBoundsGeoJSON = await this.getCityBoundsGeoJSON(this.cityName)
        this.cityBoundsLayer = L.geoJSON(cityBoundsGeoJSON)
        this.cityBoundsLayer.setStyle({
            fillColor: 'transparent',
            color: 'black',
            weight: 4
          });

        // OpenStreetMap-Kartenschicht mit Stadtgrenzen laden
        var osm = new L.TileLayer.BoundaryCanvas('https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=023456f2e3224a91892b24fe419e2603', {
          boundary: cityBoundsGeoJSON
        });

        this.map.addLayer(this.cityBoundsLayer);
        this.map.addLayer(osm);

        // Stadtteilgrenzen entfernen, wenn vorhanden
        if (this.neighborhoodLayer) {
          this.map.removeLayer(this.neighborhoodLayer);
        }

        let neighborhoodGeoJSON;
        if (this.cityName === 'Düsseldorf') {
          neighborhoodGeoJSON = DuesseldorfDistricts;
        } else if (this.cityName === 'Berlin') {
          neighborhoodGeoJSON = BerlinDistricts;
        }

        // Stadtteilgrenzen zur Karte hinzufügen
        this.neighborhoodLayer = L.geoJSON(neighborhoodGeoJSON, {
          onEachFeature: (feature, layer) => {
            if (this.cityName === 'Düsseldorf') {
              layer.bindTooltip(feature.properties.Name, {
                permanent: false,
                className: 'my-label',
                direction: 'auto'
              });
            } else if (this.cityName === 'Berlin') {
              layer.bindTooltip(feature.properties.name, {
                permanent: false,
                className: 'my-label',
                direction: 'auto'
              });
            }
            

            let isZoomed = false;
            // Ereignis 'click' zum Zoomen auf den Stadtteil und Anzeigen der Restaurants hinzufügen
            layer.on('click', () => {
              this.map.eachLayer(layer => {
                    // Überprüfen, ob das Layer ein Marker ist und ob es sich um einen Restaurantmarker handelt
                    if (layer instanceof L.Marker) {
                      this.map.removeLayer(layer); // Entferne den Marker von der Karte
                    }
              });  
              try { 
                if (!isZoomed) {
                  // Auf den Stadtteil zoomen und Restaurants in diesem Stadtteil abrufen
                  this.map.fitBounds(layer.getBounds());
                  const clickedDistrictCoordinates = layer.getBounds().getCenter(); // Koordinaten des geklickten Stadtteils
                  this.fetchRestaurantData(clickedDistrictCoordinates.lat, clickedDistrictCoordinates.lng);
                  isZoomed = true;
                } else {
                  // Zurück zur Gesamtansicht der Stadt gehen
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

        // Karte auf die Stadtgrenzen zoomen
        this.map.fitBounds(this.cityBoundsLayer.getBounds())
        
      } catch (error) {
        console.error('Fehler beim Aktualisieren der Karte:', error);
      }
    },

    // Methode zum Geocoding der Stadt
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

    // Methode zum Abrufen der Stadtgrenzen als GeoJSON
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

    // Methode zum Abrufen von Restaurantdaten in der Nähe bestimmter Koordinaten
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

    // Methode zum Hinzufügen von Restaurantmarkern auf der Karte
    addRestaurantMarkers() {
      if (Array.isArray(this.restaurants)) {
        this.restaurants.forEach(restaurant => {
          // Koordinaten des Restaurants
          const lat = restaurant.geometry.location.lat;
          const lon = restaurant.geometry.location.lng;
          // Popup-Inhalt für das Restaurant
          var infoContent = "<b>" + restaurant.name + "</b><br>" +
                        "Adresse: " + restaurant.vicinity + "<br>" +
                        "Öffnungszeiten: " + restaurant.opening_hours + "<br>" +
                        "Navigation mit Rechtsklick starten";
          var popupOnClick = L.popup().setContent(infoContent);
          var popupOnMouseover = L.popup().setContent(restaurant.name);
          // Icon für den Restaurantmarker
          var iconR = L.icon({
              iconUrl: RestaurantMarkerIcon,
              iconSize: [15, 15],
              iconAnchor: [12, 41],
              popupAnchor: [0, -41]
          });
          var markerR = L.marker([lat, lon], { icon: iconR })
          .bindPopup(infoContent)
          .addTo(this.map);

          // Ereignis 'mouseover' zum Anzeigen des Popups beim Hovern über den Marker
          markerR.on('mouseover', function() {
              markerR.bindPopup(popupOnMouseover).openPopup();
          });

          // Ereignis 'mouseout' zum Schließen des Popups beim Verlassen des Markers
          markerR.on('mouseout', function() {
              markerR.closePopup();
          });

          // Ereignis 'click' zum Anzeigen des Popups beim Klicken auf den Marker
          markerR.on('click', function() {
              markerR.bindPopup(popupOnClick).openPopup();});
          
          // Ereignis 'contextmenu' zum Starten der Navigation beim Rechtsklick auf den Marker
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

    // Methode zum Starten der Navigation zu einer bestimmten Adresse
    startNavigationTo(address) {
    // Ersetze 'address' durch die Adresse oder Koordinaten des Ziels
    var url = 'https://www.google.com/maps/dir//' + encodeURIComponent(address);
    window.open(url, '_blank');
},

  }
};
</script>

<style>
#map {
  margin-left: 5px;
  margin-right: 5px;
  width: 100%;
  height: 95vh;
  background-color: transparent;
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
