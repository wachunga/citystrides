const got = require("got");
const debug = require("debug")("streets");
const {
  addNodeCounts,
  delayToAvoidHammeringSite,
  printResults,
  sleep,
} = require("./common");

/**
 * @typedef {{ name: string, id: string, url: string, nodesUrl: string }} Street
 * @typedef {{ count: number, percentComplete: number, complete: number, incomplete: number, unknown: number, missingNode?: [Lat,Lng] }} NodeCount
 * @typedef {Street & { nodes: NodeCount }} StreetWithNode
 * @typedef {number} Lat
 * @typedef {number} Long
 * @typedef {[Lat, Long, string, string]} StreetNodesResponse
 */

const pageLimit = 1000; // sanity check

const args = process.argv.slice(2);
const [cityId, session] = args;
if (!cityId) {
  console.error("Please provide a city id from citystrides.com");
  process.exit(1);
}

if (!session) {
  console.warn("No session provided. Unable to determine street progress.");
}

(async function main() {
  const streets = await getAllCityStreets(cityId);
  console.log(`found ${streets.length} streets`);
  console.log(JSON.stringify(streets));
  const streetsWithNodeCounts = await addNodeCounts(streets, session);
  const sortedStreets = streetsWithNodeCounts
    .filter((streets) => streets.nodes.count > 0)
    .sort((a, b) => a.nodes.incomplete - b.nodes.incomplete);
  printResults(sortedStreets);
})();

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
