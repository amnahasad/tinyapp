const bodyParser = require("body-parser");
const express = require("express");
const cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { emailLookup } = require("./helpers"); //the emailLookup helper function imported into this file.

const app = express();
app.use(cookieParser());

//This is the cookie session that is being used within this file
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

//The database that stores the users short and long url data
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


//This users object will store the users data for logging in
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

//This function generates a shortURL made up of random string of 6 characters
function generateRandomString() {
  return Math.random().toString(36).substring(6);
};

//This is the GET request for the route '/'
app.get("/", (req, res) => {
  res.send("Hello!");
});

//This function takes in an id and checks to see if the id is a valid userID inside of the urlDatabase
function urlsForUser(id) {
  let filteredUrls = {};

  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredUrls[url] = urlDatabase[url];
    }
  }
  return filteredUrls;
}

/* This is a GET request for the route to view the urls, if the user is not signed in, they are prompted to login. 
They cannot see the urls unless they are logged in and unless the url is theirs. */
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


/**This is a GET request of the route for creating a new url, if the user is not signed in, they are prompted to login. 
They cannot create a new url unless they are logged in. */
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (!user) {
    return res.redirect("/login");
  }
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

/**This is a POST request for the route for viewing the urls, if the user is not signed in, they are prompted to login. 
  They cannot view their urls unless they are logged in. */
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


/**This is the GET request for the route for viewing the shortUrls, if the user is not signed in, they are prompted to login. 
  They cannot view their shortURLs unless they are logged in. If the shortURL does not belong to them, then they cannot view it.
  The user must be registered to create a short url and/or logged in to see their existing shortURLs. 
  The user will otherwise be prompted with an error message. */
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

/*This is the GET request for the route for the shortURLs, if the shortURL for this user does not exist, their the user will
 be prompted with an error message. The user must be logged in or registered inorder to view their 
 shortURLs. Clicking on the shortURL will redirect the user to the longURL*/
app.get("/u/:shortURL", (req, res) => {
  const shortUrl = req.params.shortURL;
  if (!urlDatabase[shortUrl]) {
    return res.status(400).send("Error, this url does not exist");
  }
  if (urlDatabase[shortUrl].userID !== req.session.user_id) {
    return res.status(403).send("Error, you can't use My URLS!");
  } else {
    const longURL = urlDatabase[shortUrl].longURL;
    res.redirect(longURL);
  }
});

/** This is a post request for deleting a shortUrl. The user must be logged in inorder to view and delete their
 shortURLs. If the hsortUrL does not belong to the user, then the user cannot delete the shortURL. When the 
 shortUrl is successfully deleted, the user will be redirected the the urls page.*/
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


/* This POST request route is to view and update the shortUrls. A user can only view and edit their own shortUrl; 
only when they are logged in. After the shortUrl is edited, they will be redirected back to the url page. If the 
user does not exist and they are trying to reach a shortURL, they will be prompted with an error message and 
redirected to the login page and they have to login before making any updates*/
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


/* This POST request route is for logging in. If the user enters an invalid email or 
  password, they will be prompted with an error message. When the user successfully logs 
  in, the user will be redirected to the urls page. */
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


/* This is the POST request for the logout page.*/
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

/* This is the GET request for the registration page. The user can enter a new email and 
  password to register. */
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = { user, email: req.body.email, password: req.body.password };
  res.render("urls_register", templateVars);
});


/* This POST request is for registration. The user can enter a new email and 
    password to register. If the user enters an empty form for the email and/or 
    password, the user will be prompted with an error message that the email or 
    password is empter. If the user enters an existing email address to register, 
    the user will be prompted with an error message that the email already exists.*/
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  if (email === "" || password === "") {
    return res.status(400).send("E-mail or password are empty!");
  }

  if (emailLookup(email, users)) {
    return res.status(400).send("This email is already registered, please try a different email");
  }

  //This generates a random hash string using bcrypt hashing to store the password safely, so the password is secure and no one can view it
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

//This GET request route is for logging in, the user must have a valid userid.
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = { user };
  res.render("urls_login", templateVars);
});

//This GET request route is a json request
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//This is a hello world GET request - testing
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//This is a GET request test for this route
app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

//This listens for the port number and prints out a message to the terminal when the localhost connection is successful
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});