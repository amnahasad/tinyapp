/* This function takes in an email and usersDatabase and checks to see if 
the email entered matches with the email in the database. If the email inputed matches 
with the email in the database, then it will return the user from the database, else 
the function will return undefined if the user does not exist. */
function emailLookup(email, usersDatabase) {
    for (let key in usersDatabase) {
      if (email === usersDatabase[key].email) {
        return usersDatabase[key];
      }
    }
    return undefined;
};

module.exports = { emailLookup };