const User = require("./models/User");

const isAuthenticated = async (req, res, next) => {
  const actualToken = req.headers.authorization.replace("Bearer ", "");
  const user = await User.findOne({ token: actualToken });

  if (user) {
    req.user = user;
    return next();
  } else {
    res.status(401).json("Unauthorize !");
  }
};

module.exports = isAuthenticated;
