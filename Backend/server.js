const express = require("express");
const querystring = require("querystring");
const axios = require("axios");
const cors = require("cors");
const session = require("express-session");

require("dotenv").config();
var app = express();

app.use(cors({ origin: "http://127.0.0.1:5173", credentials: true }));

app.use(session({
  secret: "spotify-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax"
  }
}));

var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = process.env.REDIRECT_URI;

//helper func
function generateRandomString(length) {
  let text = "";
  const possible = "QAZWSXEDCRFVTGBYHNUJMIKLOPqazwsxedcrfvtgbyhnujmikolp1029384756";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

app.get('/login', async (req, res) => {
  var state = generateRandomString(16);
  var scope = 'user-top-read user-read-email user-follow-read';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

async function fetchProfile(token) {
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });
  return result.json();
}

async function fetchArtists(token) {
  const result = await fetch("https://api.spotify.com/v1/me/top/artists", {
    method: "GET", headers: { Authorization: `Bearer ${token}`}
  })
  return result.json();
}

app.get('/callback', async (req, res) => {
  try {
    var code = req.query.code;
    var state = req.query.state;

    if (!code && !state) {
      return res.send("Auth Failed !!");
    }
    else {
      const authOptions = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify({
          code: code,
          redirect_uri: redirect_uri,
          grant_type: 'authorization_code'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (new Buffer.from(client_id + ":" + client_secret).toString('base64'))
          }
        });

      const access_token = authOptions.data.access_token;
      req.session.accessToken = access_token;
      console.log("Your access Token: " + req.session.accessToken);

      const profileRes = await fetchProfile(access_token);
      console.log("Profile:", JSON.stringify(profileRes, null, 2));
      req.session.profile = profileRes;
      console.log("Stored in session:", req.session.profile.display_name);

      const topArtistRes = await fetchArtists(access_token);
      //console.log("Artists: ", JSON.stringify(topArtistRes, null, 2));
      req.session.artists = topArtistRes;
      console.log("SESSION ARTISTS: ", !!req.session.artists);

      res.redirect('http://127.0.0.1:5173?loggedIn=true');
    }
  } catch (error) {
    console.error("Spotify Error:" + error);
    res.status(500).send("Token exchange failed");
  }
});

app.get('/profile', async (req, res) => {
  if (!req.session.accessToken) return res.json({ error: "Not logged in " });
  if (!req.session.profile) return res.status(401).json({ error: "Not logged in " });
  else return res.json(req.session.profile);
});

app.get('/top-artists', async (req, res) => {
  if (!req.session.accessToken) return res.json({ error: "Not logged in " });
  if (!req.session.artists) return res.status(401).json({ error: "Not logged in " });
  else return res.json(req.session.artists);
});

app.listen(8888, () => {
  console.log("Server running in port: 8888");
});