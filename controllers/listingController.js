const Listing = require('../models/Listing');
const User = require('../models/User');
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
      state: 'active',
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
    // Extract query parameters with defaults for backward compatibility
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0; // 0 means no limit (backward compatible)
    const sortBy = req.query.sortBy || 'recent'; // recent, older, priceAsc, priceDesc
    
    // Validate page and limit
    if (page < 1) {
      return res.status(400).json({ message: 'Page number must be greater than 0' });
    }
    if (limit < 0) {
      return res.status(400).json({ message: 'Limit must be non-negative' });
    }
    
    // Calculate skip value for pagination
    const skip = limit > 0 ? (page - 1) * limit : 0;
    
    // Determine sort criteria with secondary sort for consistency
    let sortCriteria = {};
    switch (sortBy.toLowerCase()) {
      case 'recent':
        sortCriteria = { created: -1, _id: -1 }; // Newest first, with _id as tiebreaker
        break;
      case 'older':
        sortCriteria = { created: 1, _id: 1 }; // Oldest first, with _id as tiebreaker
        break;
      case 'priceasc':
        sortCriteria = { price: 1, created: -1 }; // Price ascending, newest first for same price
        break;
      case 'pricedesc':
        sortCriteria = { price: -1, created: -1 }; // Price descending, newest first for same price
        break;
      default:
        // Handle invalid sortBy values gracefully
        sortCriteria = { created: -1, _id: -1 }; // Default to recent
    }
    
    // Build the query
    // We filter out sold listings
    let query = Listing.find({ state: { $ne: 'sold' } })
      .populate('createdBy', 'name')
      .sort(sortCriteria);
    
    // Apply pagination only if limit is specified
    if (limit > 0) {
      query = query.skip(skip).limit(limit);
    }
    
    const listings = await query;
    
    // If pagination is requested, also get total count for metadata
    if (limit > 0) {
      const totalCount = await Listing.countDocuments({ state: { $ne: 'sold' } });
      const totalPages = Math.ceil(totalCount / limit);
      
      res.json({
        listings,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        sortBy
      });
    } else {
      // Backward compatible response - just return the listings array
      res.json(listings);
    }
  } catch (err) {
    res.status(500).json({ message: 'Error while fetching the listings', error: err.message });
  }
};

exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('createdBy', 'name phoneNumber profilePicture town neighborhood');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Error while fetching the listing', error: err.message });
  }
};

// Get listings by seller ID
exports.getSellerListings = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    const seller = await User.findById(sellerId).select('name profilePicture town neighborhood createdAt phoneNumber');
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const listings = await Listing.find({ createdBy: sellerId })
      .sort({ created: -1 }); // Sort by newest first

    res.json({
      seller: {
      ...seller.toObject(),
      listingsCount: listings.length
      },
      listings
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Error while fetching seller listings', 
      error: err.message 
    });
  }
};

//updates the listing except the images part
//Check updateListingImages function for updating the images
exports.updateListing = async (req, res) => {
  try {
    const { title, description, price, mainCategory, subCategory, subSubCategory, state, images } = req.body;
    const listing = await Listing.findById(req.params.id).populate('createdBy', 'name phoneNumber');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.createdBy?._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this listing' });
    }
    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.price = price || listing.price;
    listing.mainCategory = mainCategory || listing.mainCategory;
    listing.subCategory = subCategory || listing.subCategory;
    listing.subSubCategory = subSubCategory || listing.subSubCategory;
    listing.state = state || listing.state;
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
    const { keyword, mainCategory, subCategory, subSubCategory, minPrice, maxPrice, page, limit, sortBy } = req.query;
    
    // Extract pagination and sorting parameters with defaults for backward compatibility
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 0; // 0 means no limit (backward compatible)
    const sortByParam = sortBy || 'recent'; // recent, older, priceAsc, priceDesc
    
    // Validate page and limit
    if (pageNum < 1) {
      return res.status(400).json({ message: 'Page number must be greater than 0' });
    }
    if (limitNum < 0) {
      return res.status(400).json({ message: 'Limit must be non-negative' });
    }
    
    // Calculate skip value for pagination
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;
    
    // Determine sort criteria with secondary sort for consistency
    let sortCriteria = {};
    switch (sortByParam.toLowerCase()) {
      case 'recent':
        sortCriteria = { created: -1, _id: -1 }; // Newest first, with _id as tiebreaker
        break;
      case 'older':
        sortCriteria = { created: 1, _id: 1 }; // Oldest first, with _id as tiebreaker
        break;
      case 'priceasc':
        sortCriteria = { price: 1, created: -1 }; // Price ascending, newest first for same price
        break;
      case 'pricedesc':
        sortCriteria = { price: -1, created: -1 }; // Price descending, newest first for same price
        break;
      default:
        // Handle invalid sortBy values gracefully
        sortCriteria = { created: -1, _id: -1 }; // Default to recent
    }
    
    // Build search query
    let query = { state: { $ne: 'sold' } }; // Filter out sold listings

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

    // Build the database query with sorting
    let dbQuery = Listing.find(query)
      .populate('createdBy', 'name')
      .sort(sortCriteria);
    
    // Apply pagination only if limit is specified
    if (limitNum > 0) {
      dbQuery = dbQuery.skip(skip).limit(limitNum);
    }

    const listings = await dbQuery;
    
    // If pagination is requested, also get total count for metadata
    if (limitNum > 0) {
      const totalCount = await Listing.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limitNum);
      
      res.json({
        listings,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
          limit: limitNum
        },
        sortBy: sortByParam,
        searchCriteria: {
          keyword: keyword || null,
          mainCategory: mainCategory || null,
          subCategory: subCategory || null,
          subSubCategory: subSubCategory || null,
          minPrice: minPrice ? Number(minPrice) : null,
          maxPrice: maxPrice ? Number(maxPrice) : null
        }
      });
    } else {
      // Backward compatible response - just return the listings array
      res.json(listings);
    }
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
      if (listing.images.length + imagesToAdd.length > 10) {
        return res.status(400).json({ message: 'Le nombre total d\'images ne peut pas dépasser 10' });
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

exports.getRecentListings = async (req, res) => {
  try {
    const recentListings = await Listing.find({ state: { $ne: 'sold' } })
      .sort({ created: -1 })
      .limit(6)
      .populate('createdBy', 'name');
    
    res.json(recentListings);
  } catch (err) {
    res.status(500).json({ message: 'Error while fetching recent listings', error: err.message });
  }
};