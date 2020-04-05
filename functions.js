/* eslint-disable no-empty-function */
/* eslint-disable no-inline-comments */

module.exports = (client) => {
  /**
   * Uses regex to check if the message contains an invite link
   * @param {object} message
   * @returns {boolean} true if there is an invite, else false
   */
  client.checkInvite = (message) => {
    message = message.cleanContent.replace(/\s/g, ''); // removes all white spaces from message
    const regex = /discord(?:app\.com\/invite|\.gg(?:\/invite)?)\/([\w-]{2,255})/i; // regex to detect invite URIs
    const matches = regex.exec(message); // executes the regex with the message
    if (matches) { // if anything was found
      if (matches[1]) {
        return true; // return true - the message contains an invite URI
      }
    }
    return false; // return false - the message is clean
  };
};