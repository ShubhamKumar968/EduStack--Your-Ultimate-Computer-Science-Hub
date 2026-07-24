// ============================================================
// controllers/favouriteController.js
// ============================================================
// PURPOSE:
//   Manages a user's personal bookmarked resources.
//   Each user has their own list — fully independent from others.
//
// ROUTES HANDLED:
//   GET    /api/favourites          → Get logged-in user's favourites
//   POST   /api/favourites/:id      → Add a resource to favourites
//   DELETE /api/favourites/:id      → Remove a resource from favourites
// ============================================================

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const Favourite = require('../models/favourite');
const Resource  = require('../models/resource');


// ============================================================
// @route   GET /api/favourites
// @desc    Get all favourited resources for the logged-in user
// @access  Private
// ============================================================
exports.getFavourites = asyncHandler(async (req, res) => {
  // Find all Favourite documents where user = logged-in user
  // .populate('resource') replaces the resource ObjectId with the full Resource document
  const favourites = await Favourite.find({ user: req.user._id })
    .populate({
      path:     'resource',
      populate: { path: 'subject', select: 'name code' }, // Nested populate: resource → subject
    })
    .sort({ createdAt: -1 }); // Most recently bookmarked first

  return sendSuccess(res, 'Favourites fetched.', {
    count: favourites.length,
    favourites,
  });
});


// ============================================================
// @route   POST /api/favourites/:resourceId
// @desc    Add a resource to the user's favourites
// @access  Private
// ============================================================
exports.addFavourite = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  // Confirm the resource exists before bookmarking it
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    return sendError(res, 'Resource not found.', 404);
  }

  // Try to create the favourite document.
  // The compound unique index { user, resource } will throw a MongoDB
  // duplicate key error (code 11000) if already bookmarked.
  // The global errorHandler will catch it and return a 409 response.
  const favourite = await Favourite.create({
    user:     req.user._id,
    resource: resourceId,
  });

  return sendSuccess(res, 'Resource added to favourites.', { favourite }, 201);
});


// ============================================================
// @route   DELETE /api/favourites/:resourceId
// @desc    Remove a resource from the user's favourites
// @access  Private
// ============================================================
exports.removeFavourite = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  // Find the exact bookmark for THIS user + THIS resource
  const favourite = await Favourite.findOneAndDelete({
    user:     req.user._id,
    resource: resourceId,
  });

  if (!favourite) {
    return sendError(res, 'This resource is not in your favourites.', 404);
  }

  return sendSuccess(res, 'Resource removed from favourites.');
});


// ============================================================
// @route   GET /api/favourites/check/:resourceId
// @desc    Check if a specific resource is in user's favourites
//          Used by the frontend to toggle the bookmark icon state
// @access  Private
// ============================================================
exports.checkFavourite = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  const exists = await Favourite.exists({
    user:     req.user._id,
    resource: resourceId,
  });

  return sendSuccess(res, 'Favourite status checked.', {
    isFavourited: !!exists, // true or false
  });
});
