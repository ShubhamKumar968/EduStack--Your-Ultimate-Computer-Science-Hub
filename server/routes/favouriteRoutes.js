// ============================================================
// routes/favouriteRoutes.js
// ============================================================
// BASE PATH (mounted in app.js): /api/favourites
//
// ENDPOINT TABLE:
//   GET    /api/favourites                    → Get my bookmarks  (private)
//   GET    /api/favourites/check/:resourceId  → Is bookmarked?    (private)
//   POST   /api/favourites/:resourceId        → Add bookmark      (private)
//   DELETE /api/favourites/:resourceId        → Remove bookmark   (private)
// ============================================================

const express = require('express');
const router  = express.Router();

const favouriteController = require('../controllers/favouriteController');
const isAuth              = require('../middlewares/isAuth');

// All favourite routes require authentication — apply globally
router.use(isAuth);

// IMPORTANT: /check/:resourceId must come BEFORE /:resourceId
// Otherwise Express would match "check" as a resourceId string
router.get('/check/:resourceId',  favouriteController.checkFavourite);
router.get('/',                   favouriteController.getFavourites);
router.post('/:resourceId',       favouriteController.addFavourite);
router.delete('/:resourceId',     favouriteController.removeFavourite);

module.exports = router;
