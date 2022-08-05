const mongoose = require("mongoose");

const FavoriteCharac = mongoose.model("Favorite", {
  id : String,
  name: String,
  picture : String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = FavoriteCharac;
