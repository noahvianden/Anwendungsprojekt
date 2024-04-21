const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const cors = require('cors'); // Importieren Sie das CORS-Paket

app.use(cors()); // Aktivieren Sie CORS
const GOOGLE_PLACES_API_KEY = 'AIzaSyA8L6nbvtOasMavozQMIdjxvvIbc4j2kjU';
const latitude = 51.2277;
const longitude = 6.7735;
const radius = 15000;

// Verbindung zur SQLite-Datenbank herstellen
const db = new sqlite3.Database('data.db');

app.use(express.json());

db.serialize(() => {
  //db.run("DROP TABLE places")
  db.run("CREATE TABLE IF NOT EXISTS places (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, latitude REAL, longitude REAL, type TEXT, vicinity TEXT, open BOOL)");
  db.run("CREATE TABLE IF NOT EXISTS districts (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255),latitude REAL, longitude REAL)")
  const insert_statement = "INSERT INTO districts (name, latitude, longitude) VALUES('Angermund', 51.33200145463446, 6.7781216611127935),('Lörick', 51.24727501670748, 6.731495056927143),('Heerdt', 51.23290314928683, 6.713007277572909),('Niederkassel', 51.24219728582317, 6.753025751812604), ('Golzheim', 51.248596666404026, 6.765221423311939),('Derendorf', 51.253921106443194, 6.781931111006989),('Carlstadt', 51.22185392517651, 6.770306037656988),('Friedrichstadt', 51.2142844391681, 6.783259910111698),('Hafen', 51.2190318370821, 6.739261374322687),('Hamm', 51.1997892792405, 6.742402061302962),('Volmerswerth', 51.186612586969105, 6.754828106115938),('Altstadt', 51.228121140423205, 6.772716924639141),('Rath', 51.266614880862214, 6.829664717766665), ('Mörsenbroich', 51.253738002923505, 6.807179363218734),('Knittkuhl', 51.26740074176867, 6.871766371152265),('Grafenberg', 51.24168639311931, 6.828167353822144)";
  const insert_2 = "INSERT INTO districts (name, latitude, longitude) VALUES('Ludenberg', 51.250741229648824, 6.854318779434423),('Hubbelrath', 51.25513627703458, 6.9049075135390625),('Eller', 51.19891211200637, 6.843315493821906),('Vennhausen', 51.209912599145085, 6.858834345913007),('Unterbach', 51.19789115640766, 6.892284936362365),('Hassels', 51.18138013171782, 6.876891633577128),('Reisholz', 51.177194982257824, 6.856714529948129),('Benrath', 51.16397504714906, 6.87597285960764),('Itter', 51.160505429677144, 6.81772989882588),('Stockum', 51.26438420655255, 6.73373261037976),('Kalkum', 51.30688290282419, 6.781930014988711),('Lichtenbroich', 51.284241912673636, 6.791865284732221),('Unterrath', 51.27094324222359, 6.778609458476814),('Lohausen', 51.28440985415545, 6.753708648275698),('Urdenbach', 51.14052409135204, 6.870618549496954),('Gerresheim', 51.2299192673581, 6.855879338998389),('Lierenfeld', 51.21383662029796, 6.827787499482941)";
  const insert_3 = "INSERT INTO districts (name, latitude, longitude) VALUES('Bilk', 51.19856646424583, 6.779945739496739),('Wersten', 51.18734833653027, 6.81922378244556),('Himmelgeist', 51.159650000141106, 6.803682540948977),('Flehe', 51.18904948027353, 6.78120266762179),('Hellerhof', 51.133328628674995, 6.910561382601422),('Garath', 51.14437228831928, 6.898068638814969),('Flingern Nord', 51.22943869250394, 6.821611377630526),('Pempelfort', 51.23576818311772, 6.7844138155730445),('Düsseltal', 51.240402924490255, 6.806684013511653),('Unterbilk', 51.21335946760508, 6.767167733485821),('Oberkassel', 51.23004639487482, 6.750651340729043),('Wittlaer', 51.32945366300621, 6.741104998061676),('Holthausen', 51.172356657805906, 6.835705358465265),('Stadtmitte', 51.223959664588065, 6.787141889346765),('Flingern Süd', 51.220828785463034, 6.812503806329393),('Oberbilk', 51.20847888466008, 6.804911787834286),('Kaiserswerth', 51.30005122210987, 6.7384863707570615)";
  db.run(insert_statement);
  db.run(insert_2);
  db.run(insert_3);
  fetchPlacesData();
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

    // Aktualisieren Sie vorhandene Orte in der Datenbank
    for (const row of rows) {
      const matchingPlace = places.find(place => place.name === row.name); //Laufzeit überprüfen & Namen identisch -> PlaceiD aus Api
      if (matchingPlace) {
        if (
          matchingPlace.geometry.location.lat !== row.latitude ||
          matchingPlace.geometry.location.lng !== row.longitude ||
          matchingPlace.types.join(', ') !== row.type
        ) {
          // Die Werte unterscheiden sich, also aktualisieren Sie den Datensatz
          await db.run("UPDATE places SET latitude = ?, longitude = ?, type = ?, vicinity = ?, open = ? WHERE name = ?",
            [
              matchingPlace.geometry.location.lat,
              matchingPlace.geometry.location.lng,
              matchingPlace.types.join(', '),
              matchingPlace.vicinity,
              matchingPlace.opening_hours && matchingPlace.opening_hours.open_now ? 1 : 0, // Setzen Sie den Wert auf 1, wenn open_now true ist, andernfalls auf 0
              row.name
            ]);
        }
      }
    }

    // Fügen Sie Daten hinzu, die noch nicht in der DB sind
    const notInDatabasePlaces = places.filter(place => !rows.some(row => row.name === place.name));
    for (const place of notInDatabasePlaces) {
      await db.run("INSERT INTO places (name, latitude, longitude, type, vicinity, open) VALUES (?, ?, ?, ?, ?, ?)",
        [
          place.name,
          place.geometry.location.lat,
          place.geometry.location.lng,
          place.types.join(', '),
          place.vicinity,
          place.opening_hours && place.opening_hours.open_now ? 1 : 0
        ]);
    }
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
  }
};

async function fetchAllPlaces() {
  const allPlaces = [];
  // Holen Sie Daten aus der SQLite-Datenbank
  const districts = await new Promise((resolve, reject) => {
    db.all("SELECT name FROM districts", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
  for (const district of districts) {
    let nextPageToken = null;
    let i = 0;
    console.log(district.name);
    do {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: 'restaurants "' + district.name + '"',
          
          key: GOOGLE_PLACES_API_KEY
        }
      });

      allPlaces.push(...response.data.results);

      nextPageToken = response.data.next_page_token;
      console.log("Seite " + i);
      console.log(nextPageToken);
      // Warten Sie eine Weile, da die nächste Seite möglicherweise noch nicht verfügbar ist
      //await new Promise(resolve => setTimeout(resolve, 1000)); // Warten Sie 2 Sekunden zwischen den Anfragen, um die API-Beschränkungen einzuhalten
      i++;
      if(i==10){
        console.log(response.data.results);
      }
    } while (nextPageToken);
  }

  console.log("Alle Places");
  return allPlaces;
}



app.get('/places', async (req, res) => {
  const { latitude, longitude } = req.query;

  try {
    const restaurants = await new Promise((resolve, reject) => {
      // Führen Sie eine SELECT-Abfrage mit den übergebenen Koordinaten und einem Radius von 2 km aus
      db.all("SELECT * FROM places WHERE type LIKE '%restaurant%' AND (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) <= 2", [latitude, longitude, latitude], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    console.log("Gefundene Restaurants:", restaurants);

    res.json({ restaurants });
  } catch (error) {
    console.error('Fehler beim Abrufen der Restaurants aus der Datenbank:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.get('/list_places', (req, res) => {
  try {
    // Holen Sie Daten aus der SQLite-Datenbank
    db.all("SELECT * FROM places", (err, rows) => {
      if (err) {
        console.error('Fehler beim Abrufen von Orten aus der Datenbank:', err);
        res.status(500).json({ error: 'Interner Serverfehler' });
      } else {
        // Daten an den Client senden
        res.json(rows);
      }
    });
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
