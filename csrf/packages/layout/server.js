import express from "express";
import Layout from "@podium/layout";

const layout = new Layout({
  name: "myLayout",
  pathname: "/",
});

const podletA = layout.client.register({
  name: "form",
  uri: "http://localhost:7100/manifest.json",
});

const podletB = layout.client.register({
  name: "json",
  uri: "http://localhost:7200/manifest.json",
});

const podletC = layout.client.register({
  name: "no-csrf-button",
  uri: "http://localhost:7300/manifest.json",
});

const app = express();

app.use(layout.middleware());

app.get(layout.pathname(), async (req, res, next) => {
  const incoming = res.locals.podium;

  const [a, b, c] = await Promise.all([
    podletA.fetch(incoming),
    podletB.fetch(incoming),
    podletC.fetch(incoming),
  ]);

  const podlets = [a, b, c];
  incoming.podlets = podlets;

  // Collect all cookies from each podlet into an array of cookies
  const cookies = podlets.reduce((acc, curr) => {
    if (curr.headers && Array.isArray(curr.headers["set-cookie"])) {
      return [...acc, ...curr.headers["set-cookie"]];
    }
    return acc;
  }, []);

  // Set the cookies from the podlets on the response
  res.setHeader("Set-Cookie", cookies);

  res.status(200).podiumSend(`
        <div>
            ${a.content}
            <hr>
            ${b.content}
            <hr>
            ${c.content}
        </div>
    `);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal error");
});

app.listen(7001);
