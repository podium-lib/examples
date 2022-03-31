const express = require("express");
const Podlet = require("@podium/podlet");

const development = process.env.NODE_ENV !== "production";

const app = express();

const podlet = new Podlet({
  name: "myPodlet",
  version: "1.0.0",
  pathname: "/",
  development,
});

// Let document served by layout load assets cross domain
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:7001");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  next();
});

app.use(podlet.middleware());

app.get(podlet.content(), (req, res) => {
  // Construct URL under which all proxy routes are located
  const { mountOrigin, publicPathname } = res.locals.podium.context;
  const url = new URL(publicPathname, mountOrigin);

  // Grab csrf token
  const token = res.locals.podium.context.csrf;

  const html = `
        <section>
            <button id="no-csrf-button" data-href="${url.href}/api/json" data-token="${token}">Post JSON - No CSRF</button>
        </section>
    `;

  res.status(200).podiumSend(html);
});

app.get(podlet.manifest(), (req, res) => {
  res.status(200).json(podlet);
});

app.post("/api/json", (req, res) => {
  res.json({
    msg: "Form successfully posted!",
  });
});

podlet.proxy({ target: "/api", name: "api" });

app.use("/static", express.static("public"));
podlet.js({ value: "/static/button.js", type: "esm" });

app.listen(7300);
