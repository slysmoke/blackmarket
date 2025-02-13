const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.get('/login', AuthController.login);
router.get('/callback', AuthController.callback);
router.get('/logout', AuthController.logout);

module.exports = router;
