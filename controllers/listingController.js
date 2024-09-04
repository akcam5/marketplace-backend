const Listing = require('../models/Listing');

exports.createListing = async (req, res) => {
  try {
    const { title, description, price, mainCategory, subCategory, subSubCategory, image } = req.body;
    const listing = new Listing({
      title,
      description,
      price,
      mainCategory,
      subCategory,
      subSubCategory,
      image,
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

exports.updateListing = async (req, res) => {
  try {
    const { title, description, price, mainCategory, subCategory, subSubCategory, image } = req.body;
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
    listing.image = image || listing.image;
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