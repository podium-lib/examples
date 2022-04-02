import express from "express";
import Podlet from "@podium/podlet";
import csrf from "csurf";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

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

// Add csrf and and cookie parsers
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Give the CSRF cookie a unique name to avoid name collision
// when the cookie is re-writen in the layout
const cookieOptions = {
  key: "podlet_b_csrf",
  secure: !development,
  httpOnly: true,
};

app.use(
  csrf({
    cookie: cookieOptions,
  })
);

app.get(podlet.content(), (req, res) => {
  // Construct URL under which all proxy routes are located
  const { mountOrigin, publicPathname } = res.locals.podium.context;
  const url = new URL(publicPathname, mountOrigin);

  // Get CSRF token
  const token = req.csrfToken();

  const html = `
        <section>
            <button id="json-valid" data-href="${url.href}/api/json" data-token="${token}">Post JSON - Valid CSRF token</button>
        </section>
        <hr>
        <section>
            <button id="json-invalid" data-href="${url.href}/api/json" data-token="${token}-INVALID">Post JSON - Invalid CSRF token</button>
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

// Serve an error page which will kick in on ex CSRF errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(403).send("Forbidden");
});

app.listen(7200);
