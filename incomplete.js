// @ts-check

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

const pageLimit = 25; // sanity check

const args = process.argv.slice(2);
const [userId, cityId, session] = args;
if (!userId) {
  console.error(
    "Please provide a user id from citystrides.com. See the readme for details."
  );
  process.exit(1);
}
if (!cityId) {
  console.error(
    "Please provide a city id from citystrides.com. See the readme for details."
  );
  process.exit(1);
}
if (!session) {
  console.warn("No session provided. Unable to determine street progress.");
}

(async function main() {
  const streets = await getIncompleteStreets(cityId);
  console.log(`found ${streets.length} incomplete streets`);
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
async function getIncompleteStreets(cityId) {
  const streets = [];

  let pageNum = 1;
  while (true) {
    debug(`fetching incomplete streets on page ${pageNum}`);
    const page = await fetchIncompleteStreetsPage(cityId, pageNum);
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
 * @param {string} cityId
 * @param {number} page
 * @returns {Promise<string>}
 */
async function fetchIncompleteStreetsPage(cityId, page) {
  const url = `https://citystrides.com/streets/search?context=city_incomplete-${cityId}-${userId}&page=${page}`;
  const requestOptions = session
    ? {
        headers: { Cookie: `_citystrides_session=${session}` },
      }
    : {};

  const { body } = await got(url, requestOptions);
  return body;
}

/**
 * @param {string} body
 * @returns {Street[]}
 */
function parseStreets(body) {
  // eg data-id="5623743" data-name="Boundary Road"
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
