const passport = require('passport');

class AuthController {
  static login(req, res, next) {
    passport.authenticate('oauth2')(req, res, next);
  }

  static callback(req, res, next) {
    passport.authenticate('oauth2', {
      successRedirect: '/',
      failureRedirect: '/login'
    })(req, res, next);
  }

  static logout(req, res) {
    req.logout(() => {
      res.redirect('/');
    });
  }
}

module.exports = AuthController;
