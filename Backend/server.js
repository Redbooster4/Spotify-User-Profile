const express = require("express");
const querystring = require("querystring");
const axios = require("axios");
const cors = require("cors");
const session = require("express-session");
const { GoogleGenAI } = require("@google/genai");

require("dotenv").config();
var app = express();
const isProd = process.env.NODE_ENV === "production";

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    httpOnly: true,
    sameSite: isProd?"none":"lax",
  }
}));

var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = process.env.REDIRECT_URI;

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const PORT = process.env.PORT || 8888;

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
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  })
  return result.json();
}

app.get('/callback', async (req, res) => {
  try {
    var code = req.query.code;
    var state = req.query.state;
    if (!code || !state) { return res.status(500).send("Auth Failed !!"); }
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
      console.log("Profile Name currently stored in session:", req.session.profile.display_name);

      const topArtistRes = await fetchArtists(access_token);
      //console.log("Artists: ", JSON.stringify(topArtistRes, null, 2));
      req.session.artists = topArtistRes;
      res.redirect(`${process.env.FRONTEND_URL}?loggedIn=true`);
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

app.post('/roast', async (req, res) => {
  if (!req.session.artists || !req.session.profile) return res.json({ error: "Roast Error" });
  else {
    const userName = req.session.profile.display_name || "User";
    const artists = req.session.artists.items.slice(0,5);
    const topArtists = artists.map(n => ({
      name: n.name,
      genres: n.genres
    }));
    const topGenreSet = new Set();
    topArtists.forEach(element => {
      element.genres.forEach(genre => topGenreSet.add(genre));
    });
    const topGenres = Array.from(topGenreSet);
    const prompt = `
ROLE: You are a witty but friendly music critic.
TASK: Your job is to roast the user's music taste in a light, playful, and harmless way
based ONLY on their Spotify listening data.
RULES:
- Keep it funny and sarcastic, not mean
- Do NOT use hate speech, slurs, profanity, or personal attacks
- Do NOT insult appearance, intelligence, race, gender, religion, or country just to be funny
- Any number short paragraphs, be creative
USER DATA:
Name: ${userName}
Top Artists:
${topArtists.map((a, i) => `${i + 1}. ${a.name}`).join("\n")}
Top Genres:
${topGenres.join(", ")}`;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      console.log(prompt);
      console.log(response.text);
      res.json({ roast: response.text });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to roast" });
    }
  }
});

app.post('/logout', async(req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("LOGOUT ERROR: ", err);
      return res.status(500).json({error: "Failed to Logout"});
    }

    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged Out"});
  });
});

app.listen(PORT, () => {
  console.log("Server running in port: "+PORT);
});