const got = require("got");
const debug = require("debug")("streets");

const delayToAvoidHammeringSite = 300;
const pageLimit = 1000; // sanity check

const args = process.argv.slice(2);
const [cityId] = args;
if (!cityId) {
  console.error("Please provide a city id from citystrides.com");
  process.exit(1);
}

(async function main() {
  const streets = await getAllCityStreets(cityId);
  const streetsWithNodeCounts = await addNodeCounts(streets);
  const sortedStreets = streetsWithNodeCounts.sort((a, b) => a.nodes - b.nodes);
  printResults(sortedStreets);
})();

function printResults(results) {
  results.forEach((result) => {
    console.log(`${result.nodes || "unknown"}\t${result.name} - ${result.url}`);
  });
}

async function getAllCityStreets(cityId) {
  const streets = [];

  let pageNum = 1;
  while (true) {
    debug(`fetching streets on page ${pageNum}`);
    const page = await fetchStreetsPage(cityId, pageNum);
    const parsedStreets = parseStreets(page);
    if (!parsedStreets.length || pageNum > pageLimit) {
      break;
    }

    streets.push(...parsedStreets);
    pageNum += 1;
    debug(`added ${parsedStreets.length} new streets`);
    await sleep(delayToAvoidHammeringSite);
  }
  return streets;
}

async function addNodeCounts(streets) {
  const total = streets.length;
  for (let i = 0; i < total; i++) {
    const street = streets[i];
    try {
      const progress = ((i / total) * 100).toFixed(2);
      debug(`fetching nodes for street ${street.id} (${progress}%)`);
      const nodeCount = await fetchStreetNodeCount(street);
      street.nodes = nodeCount;
      await sleep(delayToAvoidHammeringSite);
    } catch (error) {
      console.error(`failed to fetch node count for ${street.id}`, error);
    }
  }
  return streets;
}

async function fetchStreetNodeCount(street) {
  const response = await got(street.url);
  const match = response.body.match(/(\d+) Nodes/i);
  if (!match) {
    throw new Error(`cound not find node count for ${street.id}`);
  }
  return parseInt(match[1], 10);
}

async function fetchStreetsPage(cityId, page) {
  const cityUrl = `https://citystrides.com/cities/${cityId}`;
  const response = await got(cityUrl, {
    searchParams: {
      page_plain: page,
    },
  });
  return response.body;
}

function parseStreets(body) {
  const names = Array.from(body.matchAll(/data-name="([^"]+)"/gi)).map(
    (result) => result[1]
  );
  const ids = Array.from(body.matchAll(/data-id="([^"]+)"/gi)).map(
    (result) => result[1]
  );
  return names.map((name, index) => ({
    name,
    id: ids[index],
    url: `https://citystrides.com/streets/${ids[index]}`,
  }));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
