const got = require("got");
const debug = require("debug")("streets");

const delayToAvoidHammeringSite = 300;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @param {Street[]} streets
 * @param {string} session - _citystrides_session cookie
 * @returns {Promise<StreetWithNode[]>}
 */
async function addNodeCounts(streets, session) {
  const total = streets.length;
  for (let i = 0; i < total; i++) {
    const street = streets[i];
    try {
      const progress = ((i / total) * 100).toFixed(2);
      debug(`fetching nodes for street ${street.id} (${progress}%)`);
      const nodeCount = await fetchStreetNodeCount(street, session);
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
 * @param {string} session - _citystrides_session cookie
 * @returns {Promise<NodeCount>}
 */
async function fetchStreetNodeCount(street, session) {
  const requestOptions = session
    ? {
        headers: { Cookie: `_citystrides_session=${session}` },
      }
    : {};
  const response = await got(street.nodesUrl, requestOptions);
  /** @type {StreetNodesResponse} */
  const nodes = JSON.parse(response.body);

  const nodeCount = nodes.reduce(
    (memo, node) => {
      // eg [ 49.2840937, -123.121878, 294592677, 'purple' ]
      const statusFlag = node[3];
      if (statusFlag.startsWith("purple")) {
        memo.complete += 1;
        memo.percentComplete = memo.complete / memo.count;
      } else if (statusFlag.startsWith("red")) {
        memo.incomplete += 1;
        memo.missingNode = [node[0], node[1]];
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
      missingNode: null,
    }
  );
  return nodeCount;
}

/**
 * @param {StreetWithNode[]} results
 */
function printResults(results) {
  console.log("name,remaining,count,% complete,missingLat,missingLong,url");
  results.forEach((result) => {
    console.log(
      [
        result.name,
        result.nodes.incomplete,
        result.nodes.count,
        result.nodes.percentComplete,
        result.nodes.missingNode ? result.nodes.missingNode[0] : "",
        result.nodes.missingNode ? result.nodes.missingNode[1] : "",
        result.url,
      ].join(",")
    );
  });
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

module.exports = {
  addNodeCounts,
  delayToAvoidHammeringSite,
  sleep,
  parseStreets,
  printResults,
};
