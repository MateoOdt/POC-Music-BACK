const express = require('express');
const axios = require('axios');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const spotifyRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': 'Bearer ' + req.user.accessToken }
    });
    res.json(spotifyRes.data);
  } catch (err) {
    res.status(500).send('Erreur lors de la récupération des infos Spotify');
  }
});

module.exports = router; 