const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, town, neighborhood, phoneNumber } = req.body;
    
        // Vérifier si l'utilisateur existe déjà
        let user = await User.findOne({ email });
        if (user) {
          return res.status(400).json({ message: 'User already exists' });
        }
    
        // Créer un nouvel utilisateur
        user = new User({
          name,
          email,
          password,
          town,
          neighborhood,
          phoneNumber
        });
    
        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
    
        // Sauvegarder l'utilisateur
        await user.save();
    
        // Créer et retourner le token JWT
        const payload = {
          user: {
            id: user.id
          }
        };

        user = {_id:user.id, name: user.name, email: user.email, town: user.town, neighborhood: user.neighborhood, phoneNumber: user.phoneNumber, profilePicture: user.profilePicture}
    
        jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '1h' },
          (err, token) => {
            if (err) throw err;
            res.json({token, user});
          }
        );
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
    
        // Vérifier si l'utilisateur existe
        let user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({ message: 'Invalid Credentials' });
        }
    
        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid Credentials' });
        }
    
        // Créer et retourner le token JWT
        const payload = {
          user: {
            id: user.id
          }
        };
    
        user = {_id:user._id, name: user.name, email: user.email, town: user.town, neighborhood: user.neighborhood, phoneNumber: user.phoneNumber, profilePicture: user.profilePicture}
    
        jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '1h' },
          (err, token) => {
            if (err) throw err;
            res.json({user, token });
          }
        );
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
};

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, email, town, neighborhood, phoneNumber, profilePicture } = req.body;
    
        // Trouver l'utilisateur par ID
        let user = await User.findById(req.user.id).select('-password');
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        // Mettre à jour les champs
        user.name = name || user.name;
        user.email = email || user.email;
        user.town = town || user.town;
        user.neighborhood = neighborhood || user.neighborhood;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.profilePicture = profilePicture || user.profilePicture;
    
        // Sauvegarder les modifications
        await user.save();
    
        res.json(user);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
};

