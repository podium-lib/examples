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
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:7000");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  next();
});

// The Podium middleware must be set before any body parsing happens
// If not the proxying appied during development will mallfunction on
// the routes under CSRF
app.use(podlet.middleware());

// Add csrf and and cookie parsers
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Give the CSRF cookie a unique name to avoid name collision
// when the cookie is re-writen in the layout
const cookieOptions = {
  key: "podlet_a_csrf",
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

  /*
        NOTE: The input hidden field for the CSRF token MUST be named "_csrf"
              despite that we are giving the cookie a different name. If not
              the bodyparser will not pick out the token and hand it to
              validation :/
  */
  const html = `
        <section>
            <form action="${url.href}/api/form" method="POST" id="a">
                <input type="hidden" name="_csrf" value="${token}">
                <input type="hidden" name="text" value="A value">
                <input type="submit" value="Post Form - Valid CSRF token">
            </form>
        </section>
        <hr>
        <section>
            <form action="${url.href}/api/form" method="POST" id="b">
                <input type="hidden" name="_csrf" value="${token}-INVALID">
                <input type="hidden" name="text" value="A value">
                <input type="submit" value="Post Form - Invalid CSRF token">
            </form>
        </section>
    `;

  res.status(200).podiumSend(html);
});

app.get(podlet.manifest(), (req, res) => {
  res.status(200).json(podlet);
});

app.post("/api/form", (req, res) => {
  res.send("Form successfully posted!");
});

podlet.proxy({ target: "/api", name: "api" });

app.use("/static", express.static("public"));
podlet.js({ value: "/static/form.js", type: "esm" });

// Serve an error page which will kick in on ex CSRF errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(403).send("Forbidden");
});

app.listen(7100, () => {
  console.log('Podlet running at http://localhost:7100/');
});
