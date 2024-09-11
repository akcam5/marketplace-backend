const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const imageUploadController = require('../controllers/imageUploadController');
const auth = require('../middleware/auth');

router.post('/', auth, listingController.createListing);
router.get('/', listingController.getListings);
router.get('/search', listingController.searchListings);
router.get('/:id', listingController.getListing);
router.put('/:id', auth, listingController.updateListing);
router.delete('/:id', auth, listingController.deleteListing);

// images upload
router.post('/upload-images', auth, imageUploadController.uploadImages, imageUploadController.handleUpload);
router.put('/:id/images', auth, listingController.updateListingImages);

module.exports = router;