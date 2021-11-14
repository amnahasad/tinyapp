function emailLookup(email, usersDatabase) {
    for (let key in usersDatabase) {
      if (email === usersDatabase[key].email) {
        return usersDatabase[key];
      }
    }
    return undefined;
};

module.exports = { emailLookup };