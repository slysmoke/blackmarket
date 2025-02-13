const axios = require('axios');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const User = require('../models/User');

const setupEveAuth = () => {
  passport.use(
    new OAuth2Strategy(
      {
        authorizationURL: 'https://login.eveonline.com/v2/oauth/authorize',
        tokenURL: 'https://login.eveonline.com/v2/oauth/token',
        clientID: process.env.EVE_CLIENT_ID,
        clientSecret: process.env.EVE_CLIENT_SECRET,
        callbackURL: process.env.EVE_CALLBACK_URL,
        scope: 'publicData',
        state: true
      },
      async function(accessToken, refreshToken, profile, cb) {
        try {
          const response = await axios.get('https://login.eveonline.com/oauth/verify', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });

          const userData = {
            id: response.data.CharacterID,
            character_name: response.data.CharacterName,
            access_token: accessToken,
            refresh_token: refreshToken
          };

          const user = await User.createOrUpdate(userData);
          return cb(null, user);
        } catch (error) {
          return cb(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};

module.exports = setupEveAuth;
