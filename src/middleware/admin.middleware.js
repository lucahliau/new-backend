/**
 * Middleware to protect routes for admin users only
 * For this simple implementation, we'll use an admin token from environment variable
 * In a real application, you'd have admin role information in the user model
 */
const admin = (req, res, next) => {
    const adminToken = req.headers['x-admin-token'];
    
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }
    
    next();
  };
  
  module.exports = { admin };