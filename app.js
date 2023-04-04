const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http:localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDBObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDBObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT 
      * 
    FROM 
      player_details;`;

  const playerArray = await db.all(getPlayerQuery);
  response.send(
    playerArray.map((eachArray) =>
      convertPlayerDBObjectToResponseObject(eachArray)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT 
      * 
    FROM 
      player_details
    WHERE 
      player_id = ${playerId};`;

  const player = await db.get(getPlayersQuery);
  response.send(convertPlayerDBObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
      player_details 
    SET 
      player_name = '${playerName}'
    WHERE 
      player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `
    SELECT 
      * 
    FROM 
      match_details 
    WHERE 
      match_id = ${matchId};`;

  const matchDetails = await db.get(getMatchesQuery);
  response.send(convertMatchDBObjectToResponseObject(matchDetails));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT 
      * 
    FROM 
       player_match_score 
    NATURAL JOIN 
        match_details
    WHERE 
       player_id = ${playerId};`;

  const playerMatch = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatch.map((eachMatch) =>
      convertMatchDBObjectToResponseObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchQuery = `
    SELECT 
      * 
    FROM 
      player_match_score
    NATURAL JOIN 
      player_details
    WHERE
       match_id = ${matchId};`;

  const playersMatch = await db.all(getPlayerMatchQuery);
  response.send(
    playersMatch.map((eachPlayer) =>
      convertPlayerDBObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScore = `
    SELECT 
      player_details.player_id AS playerId,
      player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM 
       player_details
    INNER JOIN 
       player_match_score ON
       player_details.player_id = player_match_score.player_id
    WHERE 
       player_details.player_id = ${playerId};`;

  const playerMatchScore = await db.get(getPlayerScore);
  response.send(playerMatchScore);
});

module.exports = app;
