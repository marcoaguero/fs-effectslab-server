const axios = require("axios");

// Replace with your own credentials!
const FS_CREDENTIALS = {
  username: "L6M84PNUSMMUIEOFEU-IFA",
  password: "buGZJyz3QLiRZkhFFyyFEQ",
};

const get = async (params) => {
  const uri = `https://api.fastspring.com${params}`;

  const config = {
    auth: {
      username: FS_CREDENTIALS.username,
      password: FS_CREDENTIALS.password,
    },
  };

  try {
    const response = await axios.get(uri, config);
    return response.data;
  } catch (err) {
    console.log("Request error ", err.message);
    throw err;
  }
};

module.exports = { get };
