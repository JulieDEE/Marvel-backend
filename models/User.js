const mongoose = require("mongoose");

const User = mongoose.model("User", {
  account: {
    username: String,
    avatar: Object,
  },
  email: String,
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
