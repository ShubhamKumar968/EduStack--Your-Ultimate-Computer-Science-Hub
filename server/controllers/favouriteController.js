// ============================================================
// controllers/favouriteController.js
// ============================================================
// PURPOSE:
//   Manages a user's personal bookmarked resources and subjects.
//
// ROUTES HANDLED:
//   GET    /api/favourites             → Get logged-in user's favourites
//   POST   /api/favourites/:id         → Add resource or subject to favourites
//   DELETE /api/favourites/:id         → Remove resource or subject from favourites
//   GET    /api/favourites/check/:id   → Check favourite status
// ============================================================

const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const Favourite = require('../models/favourite');
const Resource  = require('../models/resource');
const Subject   = require('../models/subject');

// Helper to resolve an ID or Name to a Subject or Resource document
async function resolveTarget(idOrName) {
  if (!idOrName) return { target: null, type: null };

  if (mongoose.Types.ObjectId.isValid(idOrName)) {
    const sub = await Subject.findById(idOrName);
    if (sub) return { target: sub, type: 'subject' };

    const res = await Resource.findById(idOrName);
    if (res) return { target: res, type: 'resource' };
  }

  // Try matching subject by name or code
  const subByName = await Subject.findOne({
    $or: [
      { name: new RegExp(`^${idOrName}$`, 'i') },
      { code: idOrName.toUpperCase() }
    ]
  });
  if (subByName) return { target: subByName, type: 'subject' };

  return { target: null, type: null };
}

// ============================================================
// @route   GET /api/favourites
// @desc    Get all favourited items (subjects & resources) for logged-in user
// @access  Private
// ============================================================
exports.getFavourites = asyncHandler(async (req, res) => {
  const favourites = await Favourite.find({ user: req.user._id })
    .populate({
      path:     'resource',
      populate: { path: 'subject', select: 'name code' },
    })
    .populate('subject')
    .sort({ createdAt: -1 });

  return sendSuccess(res, 'Favourites fetched.', {
    count: favourites.length,
    favourites,
  });
});

// ============================================================
// @route   POST /api/favourites/:id
// @desc    Add a resource or subject to favourites
// @access  Private
// ============================================================
exports.addFavourite = asyncHandler(async (req, res) => {
  const targetId = req.params.id || req.params.resourceId;

  const { target, type } = await resolveTarget(targetId);

  if (!target) {
    return sendError(res, 'Target item (Subject or Resource) not found.', 404);
  }

  const query = { user: req.user._id };
  if (type === 'subject') query.subject = target._id;
  else query.resource = target._id;

  const existing = await Favourite.findOne(query);
  if (existing) {
    return sendSuccess(res, 'Item already in favourites.', { favourite: existing });
  }

  const favourite = await Favourite.create(query);
  if (type === 'subject') await favourite.populate('subject');
  else await favourite.populate('resource');

  return sendSuccess(res, 'Item added to favourites.', { favourite }, 201);
});

// ============================================================
// @route   DELETE /api/favourites/:id
// @desc    Remove a resource or subject from favourites
// @access  Private
// ============================================================
exports.removeFavourite = asyncHandler(async (req, res) => {
  const targetId = req.params.id || req.params.resourceId;

  const { target, type } = await resolveTarget(targetId);
  
  let query = { user: req.user._id };
  if (target) {
    if (type === 'subject') query.subject = target._id;
    else query.resource = target._id;
  } else if (mongoose.Types.ObjectId.isValid(targetId)) {
    query = {
      user: req.user._id,
      $or: [{ subject: targetId }, { resource: targetId }]
    };
  } else {
    return sendError(res, 'Item not found in favourites.', 404);
  }

  const favourite = await Favourite.findOneAndDelete(query);

  if (!favourite) {
    return sendError(res, 'This item is not in your favourites.', 404);
  }

  return sendSuccess(res, 'Item removed from favourites.');
});

// ============================================================
// @route   GET /api/favourites/check/:id
// @desc    Check if a specific item is in user's favourites
// @access  Private
// ============================================================
exports.checkFavourite = asyncHandler(async (req, res) => {
  const targetId = req.params.id || req.params.resourceId;

  const { target, type } = await resolveTarget(targetId);
  if (!target) {
    return sendSuccess(res, 'Favourite status checked.', { isFavourited: false });
  }

  const query = { user: req.user._id };
  if (type === 'subject') query.subject = target._id;
  else query.resource = target._id;

  const exists = await Favourite.exists(query);

  return sendSuccess(res, 'Favourite status checked.', {
    isFavourited: !!exists,
  });
});
