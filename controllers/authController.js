const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('./emailController');

const createPasswordResetToken = async (user) => {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    await user.save();

    return resetToken;
};

const comparePassword = async (candidatePassword, userPassword) => {
    return bcrypt.compare(candidatePassword, userPassword);
};

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

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
        user.password = await hashPassword(password);
    
        // Sauvegarder l'utilisateur
        await user.save();

        // Send welcome email (don't block registration if email fails)
        try {
          await sendWelcomeEmail(email, name);
          console.log(`Welcome email sent to ${email}`);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Continue with registration even if email fails
        }
    
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
          { expiresIn: '3h' },
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
        const isMatch = await comparePassword(password, user.password);
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
          { expiresIn: '3h' },
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
        if (profilePicture === "") {
            user.profilePicture = undefined;
        } else {
            user.profilePicture = profilePicture || user.profilePicture;
        }
    
        // Sauvegarder les modifications
        await user.save();
    
        res.json(user);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an email address'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email address'
            });
        }

        const resetToken = await createPasswordResetToken(user);
        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        await sendPasswordResetEmail(email, resetURL);

        res.status(200).json({
            success: true,
            message: 'Password reset email sent successfully'
        });
    } catch (error) {
        console.error('Password reset email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending password reset email',
            error: error.message
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide reset token and new password'
            });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token is invalid or has expired'
            });
        }

        user.password = await hashPassword(newPassword);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Generate new JWT token
        const jwtToken = jwt.sign(
            { user: { id: user._id } },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Password reset successful',
            token: jwtToken
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};


