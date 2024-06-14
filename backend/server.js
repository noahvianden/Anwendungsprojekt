const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const cors = require('cors'); // Importieren Sie das CORS-Paket
const { notDeepEqual } = require('assert');

app.use(cors()); // Aktivieren Sie CORS
const GOOGLE_PLACES_API_KEY = 'AIzaSyA8L6nbvtOasMavozQMIdjxvvIbc4j2kjU';
//const latitude = 51.2277;
//const longitude = 6.7735;
//const radius = 15000;

// Verbindung zur SQLite-Datenbank herstellen
const db = new sqlite3.Database('data.db');

app.use(express.json());

db.serialize(() => {
  //db.run("DROP TABLE places")
  db.run("CREATE TABLE IF NOT EXISTS places (id TEXT PRIMARY KEY, name TEXT, latitude REAL, longitude REAL, district_id INTEGER, type TEXT, vicinity TEXT, open BOOL)");
  db.run("CREATE TABLE IF NOT EXISTS districts (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255),latitude REAL, longitude REAL)")
  fetchPlacesData();
  console.log("Done");
});

async function fetchPlacesData() {
  try {
    // Holen Sie Daten aus der SQLite-Datenbank
    const rows = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM places", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    // Daten von der Google Places API abrufen
    // Verwenden Sie die Funktion fetchAllPlaces() um alle Orte abzurufen
    const places = await fetchAllPlaces();
    var update = 0;
    var insert = 0;
  // Aktualisieren Sie vorhandene Orte in der Datenbank
  /*
  for (const place of places) {
    const existingPlace = rows.find(row => row.id === place.place_id);
    if (existingPlace) {
        if (
            existingPlace.latitude !== place.geometry.location.lat ||
            existingPlace.longitude !== place.geometry.location.lng ||
            existingPlace.type !== place.types.join(', ') ||
            (existingPlace.open !== (place.opening_hours && place.opening_hours.open_now ? 1 : 0))
        ) {
            // Die Werte unterscheiden sich, also aktualisieren Sie den Datensatz
            await db.run("UPDATE places SET name = ?, latitude = ?, longitude = ?, type = ?, vicinity = ?, open = ? WHERE id = ?",
                [
                    place.name,
                    place.geometry.location.lat,
                    place.geometry.location.lng,
                    place.types.join(', '),
                    place.vicinity || place.formatted_address,
                    place.opening_hours && place.opening_hours.open_now ? 1 : 0,
                    existingPlace.id
                ]);
                update = update +1;
        }
    } else {
        // Der Ort ist nicht in der Datenbank, fügen Sie ihn hinzu
        try {
            await db.run("INSERT INTO places (id, name, latitude, longitude, district_id, type, vicinity, open) VALUES (?,?,?, ?, ?, ?, ?, ?)",
                [
                    place.place_id,
                    place.name,
                    place.geometry.location.lat,
                    place.geometry.location.lng,
                    place.district_id,
                    place.types.join(', '),
                    place.vicinity || place.formatted_address,
                    place.opening_hours && place.opening_hours.open_now ? 1 : 0
                ]);
                insert = insert + 1;
                //console.log(place);
        } catch (error) {
            console.error("Fehler beim Einfügen neuer Orte:", error);
        }
        //console.log(update);
        //console.log(insert);
    }
  }
  */

  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
  }
};

async function fetchAllPlaces() {
  const allPlaces = [];
  const placeTypes = ['restaurants, freizeit, kino']
  // Holen Sie Daten aus der SQLite-Datenbank
  const districts = await new Promise((resolve, reject) => {
    db.all("SELECT id, name FROM districts", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
  for (const district of districts) {
    let nextPageToken = null;
    for (const placeType of placeTypes){
      do {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
          params: {
            query: placeType + '"' + district.name + '"',
            key: GOOGLE_PLACES_API_KEY,
            pagetoken: nextPageToken

          }
        });

        const resultsWithDistrictId = response.data.results.map(result => ({
          ...result,
          district_id: district.id 
        }));

        allPlaces.push(...resultsWithDistrictId);

        nextPageToken = response.data.next_page_token;
      } while (nextPageToken);
    }
  }
  return allPlaces;
}

app.get('/places', async (req, res) => {
  const { districtName } = req.query;

  try {
    const dId = await new Promise((resolve, reject) => {
      // Führen Sie eine SELECT-Abfrage um die Districtid zu selektieren
      db.get("SELECT id FROM districts WHERE name = ?", [districtName], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    if (!dId) {
      return res.status(404).json({ error: 'District nicht gefunden' });
    }

    console.log('District Name:', districtName);
    console.log('District ID:', dId);

    const restaurants = await new Promise((resolve, reject) => {
      // Führen Sie eine SELECT-Abfrage um die Districtid zu selektieren
      db.all("SELECT * FROM places WHERE district_id = ?", [dId.id], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    if (restaurants.length === 0) {
      console.log('Keine Restaurants gefunden.');
    } else {
      console.log('Restaurants gefunden');
    }

    res.json({ restaurants });

  } catch (error) {
    console.error('Fehler beim Abrufen der Restaurants aus der Datenbank:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.get('/showRating', async (req, res) => {
  const { placeName } = req.query;

  try {
    const pId = await new Promise((resolve, reject) => {
      // Führen Sie eine SELECT-Abfrage um die Districtid zu selektieren
      db.get("SELECT id FROM places WHERE name = ?", [placeName], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

console.log(pId);
console.log(placeName);

    if (!pId) {
      return res.status(404).json({ error: 'Place nicht gefunden' });
    }

    console.log('Place Name:', placeName);
    console.log('Place ID:', pId);

    const ratings = await new Promise((resolve, reject) => {
      // Führen Sie eine SELECT-Abfrage um die PlaceID zu selektieren
      db.all("SELECT * FROM ratings WHERE place_id = ?", [pId.id], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    if (ratings.length === 0) {
      console.log('Keine Ratings gefunden.');
    } else {
      console.log('Ratings gefunden');
    }

    res.json({ ratings });

  } catch (error) {
    console.error('Fehler beim Abrufen der Ratings aus der Datenbank:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.get('/list_premium_partners', async (req, res) => {
  try {
    const partners = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM premium_partner", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    // Array to store partners with names
    const partnersWithName = [];

    // Iterate through each partner
    for (const partner of partners) {
      // Fetch the name for each partner
      const pName = await new Promise((resolve, reject) => {
        db.get("SELECT name FROM places WHERE id = ?", [partner.place_id], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row); // row contains the object with 'name'
          }
        });
      });

      // Add partner with name to partnersWithName array
      partnersWithName.push({
        ...partner,
        name: pName ? pName.name : null // Assign name if found, otherwise null
      });
    }
    console.log(partnersWithName);
    res.json({ partnersWithName });

  } catch (error) {
    console.error('Fehler beim Abrufen der Premium Partner aus der Datenbank:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});



const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
