const Listing = require('../models/Listing');
const { s3Client } = require('../config/awsConfig');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');


exports.createListing = async (req, res) => {
  try {
    const { title, description, price, mainCategory, subCategory, subSubCategory, images } = req.body;

    // Verification to allow a price of 0
    if (!title || !description || price === undefined || price === null || !mainCategory || !subCategory || !subSubCategory || !images) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    // Additional verification to ensure the price is a non-negative number
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ message: 'Price must be a non-negative number' });
    }

    const listing = new Listing({
      title,
      description,
      price,
      mainCategory,
      subCategory,
      subSubCategory,
      images,
      createdBy: req.user.id
    });

    await listing.save();
    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Error while creating the listing', error: err.message });
  }
};

exports.getListings = async (req, res) => {
  try {
    const listings = await Listing.find().populate('createdBy', 'name');
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Error while fetching the listings', error: err.message });
  }
};

exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('createdBy', 'name');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Error while fetching the listing', error: err.message });
  }
};

//updates the listing except the images part
//Check updateListingImages function for updating the images
exports.updateListing = async (req, res) => {
  try {
    const { title, description, price, mainCategory, subCategory, subSubCategory, images } = req.body;
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this listing' });
    }
    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.price = price || listing.price;
    listing.mainCategory = mainCategory || listing.mainCategory;
    listing.subCategory = subCategory || listing.subCategory;
    listing.subSubCategory = subSubCategory || listing.subSubCategory;
    listing.images = images || listing.images;
    listing.updated = Date.now();
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Error while updating the listing', error: err.message });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }
    await listing.deleteOne();
    res.json({ message: 'Listing deleted successfuly' });
  } catch (err) {
    res.status(500).json({ message: 'Error while deleting the listing', error: err.message });
  }
};

exports.searchListings = async (req, res) => {
  try {
    const { keyword, mainCategory, subCategory, subSubCategory, minPrice, maxPrice } = req.query;
    let query = {};

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (mainCategory) query.mainCategory = mainCategory;
    if (subCategory) query.subCategory = subCategory;
    if (subSubCategory) query.subSubCategory = subSubCategory;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const listings = await Listing.find(query).populate('createdBy', 'name');
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Error while searching the listings', error: err.message });
  }
};

exports.updateListingImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imagesToAdd, imagesToRemove } = req.body;

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    if (listing.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé à modifier cette annonce' });
    }

    // Suppression des images
    if (imagesToRemove && imagesToRemove.length > 0) {
      listing.images = listing.images.filter(img => !imagesToRemove.includes(img));
      
      // Suppression des images de S3
      for (let imageUrl of imagesToRemove) {
        const key = imageUrl.split('/').pop();
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
          }));
        } catch (error) {
          console.error(`Erreur lors de la suppression de l'image ${key} de S3:`, error);
          // Continuer avec les autres suppressions même si une échoue
        }
      }
    }

    // Ajout de nouvelles images
    if (imagesToAdd && imagesToAdd.length > 0) {
      if (listing.images.length + imagesToAdd.length > 5) {
        return res.status(400).json({ message: 'Le nombre total d\'images ne peut pas dépasser 5' });
      }
      listing.images = [...listing.images, ...imagesToAdd];
    }

    listing.updated = Date.now();
    await listing.save();

    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des images de l\'annonce', error: err.message });
  }
};