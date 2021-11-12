const bodyParser = require("body-parser");
const express = require("express");
var cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
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
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

function generateRandomString() {
  return Math.random().toString(36).substring(6);
};

function emailLookup(email) {
  for (let key in users) {
    if (email === users[key].email) {
      return users[key];
    }
  }
  return undefined;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {

  const templateVars = { user: users[req.cookies["user_id"]] };
  if (users[req.cookies["user_id"]]) {
    res.render("urls_new", templateVars);
  } else {
    // res.status(403).send("Error, you are not registered or logged in!");
    return res.redirect('/login');
  }
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: users[req.cookies["user_id"]].id};

  if (!users[req.cookies["user_id"]]) {
    res.status(403).send("Error, you are not registered or logged in!");
  } else {
    res.redirect(`/urls`);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400).send("Error, this url does not exist");
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies["user_id"]] };
  if (users[req.cookies["user_id"]]) {
    res.render("urls_show", templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400).send("Error, this url does not exist");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  console.log("THis is the longURL00------------", longURL);
  
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


app.post("/urls/:shortURL", (req, res) => {
  const user_id = users[req.cookies["user_id"]];
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL: longURL, userID: user_id};
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const {email, password} = req.body;
  const user = emailLookup(email);
  if (!user || password !== user.password) {
    return res.status(403).send("Email or password cannot be found");
  } else {
    res.cookie("user_id", user.id);
    return res.redirect("/urls");
  }
  
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], email: req.body.email, password: req.body.password };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;

  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("E-mail or password are empty!");
  } else if (emailLookup(req.body.email)) {
    res.status(400).send("This email is already registered, please try a different email");
  }
  users[id] = {
    id: id,
    email: email,
    password: password
  };
  res.cookie("user_id", id);
  console.log(users);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
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