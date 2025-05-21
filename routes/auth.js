const express = require('express');
const axios = require('axios');
const User = require('../models/User');

const router = express.Router();

// Redirection vers Spotify
router.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email';
  const redirectUri = 'https://accounts.spotify.com/authorize' +
    '?response_type=code' +
    `&client_id=${process.env.SPOTIFY_CLIENT_ID}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&redirect_uri=${encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI)}`;
  res.redirect(redirectUri);
});

// Callback Spotify
router.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  if (!code) return res.status(400).send('Code manquant');

  try {
    // Échange du code contre les tokens
    const tokenRes = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Récupère l'utilisateur Spotify
    const userRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });

    const spotifyId = userRes.data.id;

    // Stocke ou met à jour l'utilisateur
    const expiresAt = new Date(Date.now() + expires_in * 1000);
    await User.findOneAndUpdate(
      { spotifyId },
      { accessToken: access_token, refreshToken: refresh_token, expiresAt },
      { upsert: true, new: true }
    );

    // Stocke l'ID utilisateur dans un cookie sécurisé
    res.cookie('spotify_user_id', spotifyId, { httpOnly: true, secure: false }); // mettre secure: true en prod
    res.send('Authentification réussie ! Tu peux fermer cette fenêtre.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de l\'authentification Spotify');
  }
});

module.exports = router; 