const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    
    // If the Authorization header is missing
    if (!authHeader) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    
    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1];
    
    // If the token is not present after splitting the header
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    
    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ msg: 'Token is not valid' });
      }
      
      // Add the decoded user to the request
      req.user = decoded.user;
      next(); // Proceed to the next middleware or route handler
    });
  } catch (error) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
};