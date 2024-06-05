<template>
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
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';
import 'leaflet.locatecontrol';

export default {
name: 'MapComponent',
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
  async initMap() {
    await this.updateMap();
  },

  async updateCoordinates(cityName) {
    this.cityName = cityName;
    await this.updateMap();
  },

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

      const cityBoundsGeoJSON = await this.getCityBoundsGeoJSON(this.cityName);
      this.cityBoundsLayer = L.geoJSON(cityBoundsGeoJSON).setStyle({
          fillColor: 'transparent',
          color: 'black',
          weight: 4
      });

      const osm = new L.TileLayer.BoundaryCanvas('https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=023456f2e3224a91892b24fe419e2603', {
        boundary: cityBoundsGeoJSON
      });

      this.map.addLayer(this.cityBoundsLayer);
      this.map.addLayer(osm);

      if (this.neighborhoodLayer) {
        this.map.removeLayer(this.neighborhoodLayer);
      }

      let neighborhoodGeoJSON;
      if (this.cityName === 'Düsseldorf') {
        neighborhoodGeoJSON = DuesseldorfDistricts;
      } else if (this.cityName === 'Berlin') {
        neighborhoodGeoJSON = BerlinDistricts;
      }

      this.neighborhoodLayer = L.geoJSON(neighborhoodGeoJSON, {
        onEachFeature: (feature, layer) => {
          const districtName = this.cityName === 'Düsseldorf' ? feature.properties.Name : feature.properties.name;
          layer.bindTooltip(districtName, {
            permanent: false,
            className: 'my-label',
            direction: 'auto'
          });

          layer.on('click', () => {
            this.map.eachLayer(markerLayer => {
              if (markerLayer instanceof L.Marker) {
                this.map.removeLayer(markerLayer);
              }
            });

            const districtName = this.cityName === 'Düsseldorf' ? feature.properties.Name : feature.properties.name;
            this.fetchRestaurantData(districtName);

            this.map.fitBounds(layer.getBounds());
          });
        }
      }).addTo(this.map);

      const svgPattern = `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <pattern id="fogPattern" patternUnits="userSpaceOnUse" width="100" height="100">
          <image href="${cloudPattern}" x="0" y="0" width="100" height="100" />
        </pattern>
      </svg>
      `;
      const svgElement = document.createElement('div');
      svgElement.innerHTML = svgPattern;
      document.querySelector('.leaflet-map-pane').appendChild(svgElement);

      this.neighborhoodLayer.setStyle({
        fillColor: 'url(#fogPattern)',
        fillOpacity: 1,
        color: 'gray',
        weight: 1,
        opacity: 0.4,
      });

      this.map.fitBounds(this.cityBoundsLayer.getBounds());

      // Hinzufügen der Locate-Control
      L.control.locate({
        position: 'topleft',
        strings: {
          title: "Show me where I am!"
        },
        locateOptions: {
          enableHighAccuracy: true,
        }
      }).addTo(this.map);

      this.map.on('locationfound', function(e) {
        const radius = e.accuracy / 2;
        L.marker(e.latlng).addTo(this.map)
          .bindPopup("You are within " + radius + " meters from this point").openPopup();
        L.circle(e.latlng, radius).addTo(this.map);
      }.bind(this));

      this.map.on('locationerror', function(e) {
        alert(e.message);
      });

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

  async fetchRestaurantData(districtName) {
    try {
      const response = await axios.get('http://localhost:3000/places', {
        params: { districtName }
      });

      this.restaurants = response.data.restaurants;
      this.addRestaurantMarkers();
    } catch (error) {
      console.error('Fehler beim Abrufen der Restaurantdaten:', error);
    }
  },

  addRestaurantMarkers() {
    if (Array.isArray(this.restaurants)) {
      this.restaurants.forEach(restaurant => {
        const lat = restaurant.latitude;
        const lon = restaurant.longitude;
        const offen = restaurant.open ? "Ja" : "Nein";
        const infoContent = `<b>${restaurant.name}</b><br>Adresse: ${restaurant.vicinity}<br>geöffnet: ${offen}<br>Navigation mit Rechtsklick starten`;
        const popupOnClick = L.popup().setContent(infoContent);
        const popupOnMouseover = L.popup().setContent(restaurant.name);
        const iconUrl = restaurant.type.includes('restaurant') ? RestaurantMarkerIcon : LocationMarkerIcon;
        const iconR = L.icon({
          iconUrl,
          iconSize: [15, 15],
          iconAnchor: [12, 41],
          popupAnchor: [0, -41]
        });

        const markerR = L.marker([lat, lon], { icon: iconR })
          .bindPopup(infoContent)
          .addTo(this.map);

        markerR.on('mouseover', () => markerR.bindPopup(popupOnMouseover).openPopup());
        markerR.on('mouseout', () => markerR.closePopup());
        markerR.on('click', () => markerR.bindPopup(popupOnClick).openPopup());
        markerR.on('contextmenu', () => this.startNavigationTo(restaurant.name));
      });
    } else {
      console.error('Die Restaurantdaten sind kein Array.');
       }
     },

     startNavigationTo(address) {
       console.log("Navigation gestartet zu:", address);
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
