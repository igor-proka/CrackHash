const replicaSet = (typeof process !== "undefined" && process.env && process.env.MONGO_REPLICA_SET)
  ? process.env.MONGO_REPLICA_SET
  : "rs0";

function waitForPrimary() {
  for (let i = 0; i < 60; i += 1) {
    const status = rs.status();
    const primary = status.members.find((member) => member.stateStr === "PRIMARY");
    if (primary) {
      print(`MongoDB replica set ${replicaSet} primary is ready: ${primary.name}`);
      return;
    }
    sleep(1000);
  }

  throw new Error(`MongoDB replica set ${replicaSet} did not elect primary in time`);
}

let initialized = false;

try {
  const status = rs.status();
  print(`MongoDB replica set already initialized: ${status.set}`);
  initialized = true;
} catch (error) {
  initialized = false;
}

if (initialized) {
  waitForPrimary();
} else {
  print(`Initializing MongoDB replica set ${replicaSet}`);
  rs.initiate({
    _id: replicaSet,
    members: [
      { _id: 0, host: "mongo1:27017" },
      { _id: 1, host: "mongo2:27017" },
      { _id: 2, host: "mongo3:27017" }
    ]
  });
  waitForPrimary();
}
