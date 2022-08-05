const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const User = require("./models/User");
const FavoriteCharac = require("./models/FavoriteCharac");
const isAuthenticated = require("./isAuthentificated");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGOOSE);

const apiKey = process.env.MARVEL_KEY;

app.get("/comics", async (req, res) => {
  let limit = req.query.limit;
  let skip = limit * req.query.page;
  let filters = "";

  if (req.query.title) {
    filters = filters + `&title=${req.query.title}`;
  }

  const response = await axios.get(
    `https://lereacteur-marvel-api.herokuapp.com/comics?apiKey=${apiKey}&limit=${limit}&skip=${skip}` +
      filters
  );
  res.json(response.data);
});

app.get("/characters", async (req, res) => {
  let limit = req.query.limit;
  let skip = limit * req.query.page;

  let filters = "";

  if (req.query.name) {
    filters = filters + `&name=${req.query.name}`;
  }
  const response = await axios.get(
    `https://lereacteur-marvel-api.herokuapp.com/characters?apiKey=${apiKey}&limit=${limit}&skip=${skip}` +
      filters
  );
  res.json(response.data);
});

app.get("/characters/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/character/${req.params.id}?apiKey=${apiKey}`
    );
    res.json(response.data);
  } catch (error) {
    res.json(error.message);
  }
});

app.get("/comics/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/comics/${req.params.id}?apiKey=${apiKey}`
    );
    res.json(response.data);
  } catch (error) {
    res.json(error.message);
  }
});

app.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const password = req.body.password;
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(16);
    const userExist = await User.findOne({ email: req.body.email });
    const convertToBase64 = (file) => {
      return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
    };

    const myPictureInBase64 = convertToBase64(req.files.picture);
    const pictureUpload = await cloudinary.uploader.upload(myPictureInBase64);

    if (!req.body.username) {
      res.json("Erreur : le nom de l'utilisateur n'est pas renseigné");
    } else if (userExist === null) {
      const newUser = new User({
        account: {
          username: req.body.username,
        },
        email: req.body.email,
        salt: salt,
        hash: hash,
        token: token,
      });
      if (req.files) {
        newUser.account.avatar = pictureUpload;
      }

      await newUser.save();

      res.json({
        _id: newUser._id,
        username: req.body.username,
        token: token,
      });
      console.log(req.body);
    } else {
      res
        .status(400)
        .json("Erreur : un utilisateur correspond déjà à cet email ! ");
    }
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error);
  }
});

app.post("/user/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  console.log(user);
  const salt = user.salt;
  const token = user.token;
  const hash = user.hash;
  const tempHash = SHA256(req.body.password + salt).toString(encBase64);

  if (tempHash === hash) {
    res.json({
      id: user._id,
      token: token,
      username: user.username,
    });
  } else {
    res.status(400).json("Erreur : Le mot de passe est erroné !");
  }
});

app.post(
  "/charac/favorites",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      const newFavorite = new FavoriteCharac({
        id: req.body.id,
        name: req.body.name,
        picture: req.body.picture,
        owner: req.user,
      });

      await newFavorite.save();

      res.json(newFavorite);
    } catch (error) {
      res.status(400).json(error.message);
    }
  }
);

app.get("/profil", async (req, res) => {
  const allFavoritesCharac = await FavoriteCharac.find({
    owner: req.query.id,
  });
  res.json(allFavoritesCharac);
});

app.get("/user/infos", async (req, res) => {
  const userInfos = await User.findById(req.query.id).select(
    "email account.username account.avatar"
  );
  res.json(userInfos);
});

app.all("*", async (req, res) => {
  res.status(404).send("Oups, page introuvable !");
});

app.listen(process.env.PORT, () => {
  console.log("serveur is running on PORT 4100");
});
