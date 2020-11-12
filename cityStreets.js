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
  const sortedStreets = streetsWithNodeCounts.sort(
    (a, b) => a.nodes.count - b.nodes.count
  );
  printResults(sortedStreets);
})();

function printResults(results) {
  console.log("name,count,% complete,url");
  results.forEach((result) => {
    console.log(
      [
        result.name,
        result.nodes.count,
        result.nodes.percentComplete,
        result.url,
      ].join(",")
    );
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
  const response = await got(street.nodesUrl);
  const nodes = JSON.parse(response.body);
  const nodeCount = nodes.reduce(
    (memo, current) => {
      // eg [49.2428814, -123.0579478, 99392311, "ch-motorway-2"]
      const statusFlag = current[3];
      if (statusFlag.startsWith("gr-")) {
        memo.complete += 1;
        memo.percentComplete = memo.complete / memo.count;
      } else if (statusFlag.startsWith("ch-")) {
        memo.incomplete += 1;
      } else {
        memo.unknown += 1;
      }
      return memo;
    },
    {
      count: nodes.length,
      percentComplete: 0,
      complete: 0,
      incomplete: 0,
      unknown: 0,
    }
  );
  return nodeCount;
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
    nodesUrl: `https://citystrides.com/streets/${ids[index]}/markers.json`,
  }));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
