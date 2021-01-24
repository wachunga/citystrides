const got = require("got");
const debug = require("debug")("streets");

/**
 * @typedef {{ name: string, id: string, url: string, nodesUrl: string }} Street
 * @typedef {{ count: number, percentComplete: number, complete: number, incomplete: number, unknown: number }} NodeCount
 * @typedef {Street & { nodes: NodeCount }} StreetWithNode
 * @typedef {number} Lat
 * @typedef {number} Long
 * @typedef {[Lat, Long, string, string]} StreetNodesResponse
 */

const delayToAvoidHammeringSite = 300;
const pageLimit = 1000; // sanity check

const args = process.argv.slice(2);
const [cityId, session] = args;
if (!cityId) {
  console.error("Please provide a city id from citystrides.com");
  process.exit(1);
}

if (!session) {
  console.log("No session provided. Unable to determine street progress.");
}

(async function main() {
  const streets = await getAllCityStreets(cityId);
  const streetsWithNodeCounts = await addNodeCounts(streets);
  const sortedStreets = streetsWithNodeCounts
    .filter((streets) => streets.nodes.count > 0)
    .sort((a, b) => a.nodes.incomplete - b.nodes.incomplete);
  printResults(sortedStreets);
})();

/**
 * @param {Street[]} results
 */
function printResults(results) {
  console.log("name,remaining,count,% complete,url");
  results.forEach((result) => {
    console.log(
      [
        result.name,
        result.nodes.incomplete,
        result.nodes.count,
        result.nodes.percentComplete,
        result.url,
      ].join(",")
    );
  });
}

/**
 * @param {string} cityId
 * @returns {Promise<Street[]>}
 */
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

/**
 * @param {Street[]} streets
 * @returns {Promise<StreetWithNode[]>}
 */
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

/**
 * @param {Street} street
 * @returns {Promise<NodeCount>}
 */
async function fetchStreetNodeCount(street) {
  const requestOptions = session
    ? {
        headers: { Cookie: `_citystrides_session=${session}` },
      }
    : {};
  const response = await got(street.nodesUrl, requestOptions);
  /** @type {StreetNodesResponse} */
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

/**
 * Returns the HTML of the streets page
 *
 * @param {number} cityId
 * @param {string} page
 * @returns {Promise<string>}
 */
async function fetchStreetsPage(cityId, page) {
  const cityUrl = `https://citystrides.com/cities/${cityId}`;
  const response = await got(cityUrl, {
    searchParams: {
      page_plain: page,
    },
  });
  return response.body;
}

/**
 * @param {string} body
 * @returns {Street[]}
 */
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
