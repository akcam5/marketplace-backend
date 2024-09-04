const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const auth = require('../middleware/auth');

router.post('/', auth, listingController.createListing);
router.get('/', listingController.getListings);
router.get('/search', listingController.searchListings);
router.get('/:id', listingController.getListing);
router.put('/:id', auth, listingController.updateListing);
router.delete('/:id', auth, listingController.deleteListing);

module.exports = router;