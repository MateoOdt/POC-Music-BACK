const User = require('../models/User');
const axios = require('axios');

module.exports = async function requireAuth(req, res, next) {
  const spotifyUserId = req.cookies.spotify_user_id;
  if (!spotifyUserId) return res.status(401).send('Non authentifié');

  let user = await User.findOne({ spotifyId: spotifyUserId });
  if (!user) return res.status(401).send('Utilisateur inconnu');

  // Rafraîchit le token si expiré
  if (user.expiresAt < new Date()) {
    try {
      const tokenRes = await axios.post('https://accounts.spotify.com/api/token', null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: user.refreshToken,
          client_id: process.env.SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      user.accessToken = tokenRes.data.access_token;
      user.expiresAt = new Date(Date.now() + tokenRes.data.expires_in * 1000);
      await user.save();
    } catch (err) {
      return res.status(401).send('Impossible de rafraîchir le token');
    }
  }

  req.user = user;
  next();
}; 