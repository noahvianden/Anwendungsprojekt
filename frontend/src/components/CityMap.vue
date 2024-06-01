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
import LocationMarkerIcon from '@/assets/freetime.png';
import cloudPattern from '@/assets/cloudPattern1_b&w.png';
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
      neighborhoodClickedTiles: {},
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
    this.map.eachLayer(markerLayer => {
        if (markerLayer instanceof L.Marker) {
            this.map.removeLayer(markerLayer); // Remove markers from the map
        }
    });

    try {
      let districtName;
        if (this.cityName === 'Düsseldorf') {
            districtName = feature.properties.Name;
        } else if (this.cityName === 'Berlin') {
            districtName = feature.properties.name;
        }
        if (layer.options.fillOpacity === 0) {
            // If fill opacity is 0, zoom to the district
            if (!isZoomed) {
                this.map.fitBounds(layer.getBounds());
                //const clickedDistrictCoordinates = layer.getBounds().getCenter();
                this.fetchRestaurantData(districtName);
                isZoomed = true;
            } else {
                // Zoom out to the city bounds
                this.map.fitBounds(this.cityBoundsLayer.getBounds());
                isZoomed = false;
            }
        } else {
            // If fill opacity is not 0, set it to 0
            layer.setStyle({ fillOpacity: 0 });
        }
    } catch (error) {
        console.error('Fehler beim Klicken auf den Layer:', error);
    }
});
          }
        }).addTo(this.map);

        // Define the SVG pattern with the imported asset.
        const svgPattern = `
        <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <pattern id="fogPattern" patternUnits="userSpaceOnUse" width="100" height="100">
            <image href="${cloudPattern}" x="0" y="0" width="100" height="100" />
          </pattern>
        </svg>
        `;

        // Step 2: Create an SVG element and append it to the map's DOM.
        var svgElement = document.createElement('div');
        svgElement.innerHTML = svgPattern;
        document.querySelector('.leaflet-map-pane').appendChild(svgElement);

        // Step 3: Apply the pattern to your layer.
        this.neighborhoodLayer.setStyle({
          fillColor: 'url(#fogPattern)', // Verwende das SVG-Pattern als Füllung.
          fillOpacity: 1, // Stelle sicher, dass die Füllung volle Deckkraft hat.
          color: 'gray',  // Linienfarbe.
          weight: 1,     // Liniengewicht.
          opacity: 0.4,    // Linie sollte volle Deckkraft haben.
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
    //async fetchRestaurantData(latitude, longitude) {
      async fetchRestaurantData(districtName) {
      try {
        const response = await axios.get('http://localhost:3000/places', {
          params: {
            districtName
          }
        });

        this.restaurants = response.data.restaurants; // Speichere die Restaurantdaten im Datenobjekt
        console.log(this.restaurants);
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
      const lat = restaurant.latitude;
      const lon = restaurant.longitude;
      // Popup-Inhalt für das Restaurant
      var offen = restaurant.open ? "Ja" : "Nein"; // Simplified if-else statement
      var infoContent = "<b>" + restaurant.name + "</b><br>" +
                    "Adresse: " + restaurant.vicinity + "<br>" +
                    "geöffnet: " + offen + "<br>" +
                    "Navigation mit Rechtsklick starten";
      var popupOnClick = L.popup().setContent(infoContent);
      var popupOnMouseover = L.popup().setContent(restaurant.name);
      // Icon für den Restaurantmarker
      var iconUrl = restaurant.type.includes('restaurant') ? RestaurantMarkerIcon : LocationMarkerIcon;
      var iconR = L.icon({
          iconUrl: iconUrl,
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
          markerR.bindPopup(popupOnClick).openPopup();
      });
      
      // Ereignis 'contextmenu' zum Starten der Navigation beim Rechtsklick auf den Marker
      markerR.on('contextmenu', () => {
          this.startNavigationTo(restaurant.name);
      });

    });
  } else {
    console.error('Die Restaurantdaten sind kein Array.');
  }
},


    // Methode zum Starten der Navigation zu einer bestimmten Adresse
    startNavigationTo(address) {
      console.log("gestartet in CityMap")
      this.$emit('start-navigation', address);
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
