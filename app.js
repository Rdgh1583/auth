const express = require("express");
const app = express();
const axios = require("axios");

app.use(express.json());
app.engine("html", require("ejs").renderFile);

const secrets = require("./secrets");
process.env.GITHUB_CLIENT_ID = secrets.GITHUB_CLIENT_ID;
process.env.GITHUB_CLIENT_SECRET = secrets.GITHUB_CLIENT_SECRET;

// console.log(secrets.GITHUB_CLIENT_ID);

const {
  models: { User },
} = require("./db");
const path = require("path");

app.get("/", (req, res) =>
  res.render(path.join(__dirname, "index.html"), {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  })
);

app.get("/api/auth", async (req, res, next) => {
  try {
    res.send(await User.byToken(req.headers.authorization));
  } catch (ex) {
    next(ex);
  }
});

app.get("/github/callback", async (req, res, next) => {
  try {
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        code: req.query.code,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
      }
    );
    const token = await User.authenticate(req.query.code);
    res.send(`
      <html>
       <body>
       <script>
        window.localStorage.setItem('token', '${token}');
        window.document.location = '/';
       </script>
        </body>
      </html>
    `);
    // res.send(response);
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
