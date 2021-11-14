const bodyParser = require("body-parser");
const express = require("express");
const cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { emailLookup } = require("./helpers");

const app = express();
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "a@a.com",
    password: bcrypt.hashSync("123", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "b@b.com",
    password: bcrypt.hashSync("123", 10)
  }
};

function generateRandomString() {
  return Math.random().toString(36).substring(6);
};


app.get("/", (req, res) => {
  res.send("Hello!");
});


function urlsForUser(id) {
  let filteredUrls = {};

  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredUrls[url] = urlDatabase[url];
    }
  }
  return filteredUrls;
}

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const filteredUrls = urlsForUser(userId);

  if (!user) {
    return res.redirect("/login");
  }
  const templateVars = { user, filteredUrls };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (!user) {
    return res.redirect("/login");
  }
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const longURL = req.body.longURL;
  if (!user) {
    return res.redirect("/login");
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID: userId };
  res.redirect(`/urls`);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const filteredUrls = urlsForUser(userId);
  if (!user) {
    return res.redirect("/login");
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(400).send("Error, this url does not exist");
  }
  const shortUrl = req.params.shortURL;
  const templateVars = { shortUrl, longURL, user, filteredUrls };
  if (urlDatabase[shortUrl].userID !== userId) {
    return res.status(403).send("Error, you can't view My URLS. You must be registered or log in!");
  } else {
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortUrl = req.params.shortURL;
  if (!urlDatabase[shortUrl]) {
    return res.status(400).send("Error, this url does not exist");
  }
  if (urlDatabase[shortUrl].userID !== userId) {
    return res.status(403).send("Error, you can't delete My URLS!");
  } else {
    const longURL = urlDatabase[shortUrl].longURL;
    res.redirect(longURL);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res.redirect("/login");
  }
  const shortUrl = req.params.shortURL;
  if (!urlDatabase[shortUrl]) {
    return res.status(403).send("Error, url does not exist");
  }
  if (urlDatabase[shortUrl].userID !== userId) {
    return res.status(403).send("Error, you can't delete My URLS!");
  } else {
    delete urlDatabase[shortUrl];
    res.redirect("/urls");
  }
});


app.post("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res.redirect("/login");
  }
  const shortUrl = req.params.shortURL;
  const longURL = req.body.longURL;
  if (urlDatabase[shortUrl].userID !== userId) {
    res.status(403).send("Error, you can't update My URLS!");
  } else {
    urlDatabase[shortUrl].longURL = longURL;
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = emailLookup(email, users);
  if (!user) {
    return res.status(403).send("Email or password cannot be found");
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Email or password cannot be found");
  }
  req.session.user_id = user.id;
  return res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = { user, email: req.body.email, password: req.body.password };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  if (email === "" || password === "") {
    return res.status(400).send("E-mail or password are empty!");
  }

  if (emailLookup(email, users)) {
    return res.status(400).send("This email is already registered, please try a different email");
  }

  let id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = {
    id: id,
    email,
    password: hashedPassword
  };
  req.session.user_id = id;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = { user };
  res.render("urls_login", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});