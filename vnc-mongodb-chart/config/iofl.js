// 1. iofl_client

db.iofl_client_view.drop();
db.createView(
    "iofl_client_view", // name of view
    "iofl", // Source collection
    [
        {
            $project:
            {
                _id: 0,
                clfi: 1,
                "a-clli": "$info.a-clli",
                "z-clli": "$info.z-clli",
                "common-id": "$info.common-id",
                "a-fiber-cable-name": { $arrayElemAt: ["$iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.fiber-cable-name", 0] },
                "a-fiber-cable-strand-number": { $arrayElemAt: ["$iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.fiber-cable-strand-number", 0] },
                "a-roadm-faceplate-id": { $arrayElemAt: [ "$iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.roadm-faceplate-id", 0] },
                "a-roadm-circuit-pack-name": { $arrayElemAt: [ "$iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.roadm-circuit-pack-name", 0] },
                "a-roadm-name": { $arrayElemAt: [ "$iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.roadm-name", 0] },
                "a-roadm-port-name": { $arrayElemAt: [ "$iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.roadm-port-name", 0] },
                "z-fiber-cable-name": { $arrayElemAt: [ "$iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.fiber-cable-name", 0] },
                "z-fiber-cable-strand-number": { $arrayElemAt: [ "$iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.fiber-cable-strand-number", 0] },
                "z-roadm-faceplate-id": { $arrayElemAt: [ "$iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.roadm-faceplate-id", 0] },
                "z-roadm-circuit-pack-name": { $arrayElemAt: [ "$iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.roadm-circuit-pack-name", 0] },
                "z-roadm-name": { $arrayElemAt: [ "$iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.roadm-name", 0] },
                "z-roadm-port-name": { $arrayElemAt: [ "$iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.roadm-port-name", 0] }
            }
        },
        {
            "$addFields": {
                "etl_hash_id_str": {
                    "$reduce": {
                        "input": {
                            "$map": {
                                "input": {
                                    "$objectToArray": "$$ROOT"
                                },
                                "as": "kv",
                                "in": {
                                    "$toString": "$$kv.v"
                                }
                            }
                        },
                        "initialValue": "",
                        "in": {
                            "$concat": ["$$value", { $ifNull: ["$$this", ""] }]
                        }
                    }
                }
            }
        },
        {
            $project:
            {
                _id: 0,
                clfi: 1,
                "a-clli": 1,
                "z-clli": 1,
                "common-id": 1,
                "a-fiber-cable-name": 1,
                "a-fiber-cable-strand-number": 1,
                "a-roadm-faceplate-id": 1,
                "a-roadm-circuit-pack-name": 1,
                "a-roadm-name": 1,
                "a-roadm-port-name": 1,
                "z-fiber-cable-name": 1,
                "z-fiber-cable-strand-number": 1,
                "z-roadm-faceplate-id": 1,
                "z-roadm-circuit-pack-name": 1,
                "z-roadm-name": 1,
                "z-roadm-port-name": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in iofl_client_view:", db.iofl_client_view.countDocuments());

// 2. iofl_network

db.iofl_network_view.drop();
db.createView(
    "iofl_network_view", // name of view
    "iofl", // Source collection
    [
        {
            $project:
            {
                _id: 0,
                clfi: 1,
                "a-clli": "$info.a-clli",
                "z-clli": "$info.z-clli",
                "common-id": "$info.common-id",
                "a-fiber-cable-name": { $arrayElemAt: ["$iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.fiber-cable-name", 0] },
                "a-fiber-cable-strand-number": { $arrayElemAt: ["$iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.fiber-cable-strand-number", 0] },
                "a-roadm-faceplate-id": { $arrayElemAt: ["$iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.roadm-faceplate-id", 0] },
                "a-roadm-circuit-pack-name": { $arrayElemAt: [ "$iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.roadm-circuit-pack-name", 0] },
                "a-roadm-name": { $arrayElemAt: [ "$iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.roadm-name", 0] },
                "a-roadm-port-name": { $arrayElemAt: [ "$iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.roadm-port-name", 0] },
                "z-fiber-cable-name": { $arrayElemAt: [ "$iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.fiber-cable-name", 0] },
                "z-fiber-cable-strand-number": { $arrayElemAt: [ "$iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.fiber-cable-strand-number", 0] },
                "z-roadm-faceplate-id": { $arrayElemAt: [ "$iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.roadm-faceplate-id", 0] },
                "z-roadm-circuit-pack-name": { $arrayElemAt: [ "$iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.roadm-circuit-pack-name", 0] },
                "z-roadm-name": { $arrayElemAt: [ "$iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.roadm-name", 0] },
                "z-roadm-port-name": { $arrayElemAt: [ "$iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.roadm-port-name", 0] }
            }
        },
        {
            "$addFields": {
                "etl_hash_id_str": {
                    "$reduce": {
                        "input": {
                            "$map": {
                                "input": {
                                    "$objectToArray": "$$ROOT"
                                },
                                "as": "kv",
                                "in": {
                                    "$toString": "$$kv.v"
                                }
                            }
                        },
                        "initialValue": "",
                        "in": {
                            "$concat": ["$$value", { $ifNull: ["$$this", ""] }]
                        }
                    }
                }
            }
        },
        {
            $project:
            {
                _id: 0,
                clfi: 1,
                "a-clli": 1,
                "z-clli": 1,
                "common-id": 1,
                "a-fiber-cable-name": 1,
                "a-fiber-cable-strand-number": 1,
                "a-roadm-faceplate-id": 1,
                "a-roadm-circuit-pack-name": 1,
                "a-roadm-name": 1,
                "a-roadm-port-name": 1,
                "z-fiber-cable-name": 1,
                "z-fiber-cable-strand-number": 1,
                "z-roadm-faceplate-id": 1,
                "z-roadm-circuit-pack-name": 1,
                "z-roadm-name": 1,
                "z-roadm-port-name": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in iofl_network_view:", db.iofl_network_view.countDocuments());