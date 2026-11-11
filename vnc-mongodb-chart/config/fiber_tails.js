// 1. fiber_tails

db.fiber_tails_view.drop();
db.createView(
    "fiber_tails_view", // name of view
    "fiber_tails", // Source collection
    [
        {
            "$project": {
                "_id": 0,
                "clfi": 1,
                "lifecycle-state": 1,
                "type": 1,
                "towards-client-fiber-cable-name": {
                    "$arrayElemAt": [
                        "$topology-towards-client.tail-resource-entry.resource.fiber-cable-name",
                        0
                    ]
                },
                "towards-client-fiber-cable-strand-number": {
                    "$arrayElemAt": [
                        "$topology-towards-client.tail-resource-entry.resource.fiber-cable-strand-number",
                        0
                    ]
                },
                "towards-client-type": {
                    "$arrayElemAt": [
                        "$topology-towards-client.tail-resource-entry.resource.type",
                        0
                    ]
                },
                "towards-client-wiring-record-sequence-number": {
                    "$arrayElemAt": [
                        "$topology-towards-client.tail-resource-entry.resource.wiring-record-sequence-number",
                        0
                    ]
                },
                "towards-client-svc-end-port-device": {
                    "$arrayElemAt": [
                        "$topology-towards-client.tail-resource-entry.resource.svc-end-port-device",
                        0
                    ]
                },
                "towards-client-svc-end-port-direction-used": {
                    "$arrayElemAt": [
                        "$topology-towards-client.tail-resource-entry.resource.svc-end-port-direction-used",
                        0
                    ]
                },
                "towards-client-svc-end-port-lgx-name": {
                    "$arrayElemAt": [
                        "$topology-towards-client.tail-resource-entry.resource.svc-end-port-lgx-name",
                        0
                    ]
                },
                "towards-client-svc-end-port-name": {
                    "$arrayElemAt": [
                        "$topology-towards-client.tail-resource-entry.resource.svc-end-port-name",
                        0
                    ]
                },
                "towards-client-svc-end-port-rack": {
                    "$arrayElemAt": [
                        "$topology-towards-client.tail-resource-entry.resource.svc-end-port-rack",
                        0
                    ]
                },
                "towards-client-svc-end-port-shelf": {
                    "$arrayElemAt": [
                        "$topology-towards-client.tail-resource-entry.resource.svc-end-port-shelf",
                        0
                    ]
                },
                "towards-network-fiber-cable-name": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.fiber-cable-name",
                        0
                    ]
                },
                "towards-network-roadm-circuit-pack-name": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.roadm-circuit-pack-name",
                        0
                    ]
                },
                "towards-network-roadm-name": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.roadm-name",
                        0
                    ]
                },
                "towards-network-roadm-port-name": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.roadm-port-name",
                        0
                    ]
                },
                "towards-network-xponder-circuit-pack-name": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.xponder-circuit-pack-name",
                        0
                    ]
                },
                "towards-network-xponder-device": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.xponder-device",
                        0
                    ]
                },
                "towards-network-xponder-port-name": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.xponder-port-name",
                        0
                    ]
                },
                "towards-network-svc-end-port-device": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.svc-end-port-device",
                        0
                    ]
                },
                "towards-network-svc-end-port-direction-used": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.svc-end-port-direction-used",
                        0
                    ]
                },
                "towards-network-svc-end-port-lgx-name": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.svc-end-port-lgx-name",
                        0
                    ]
                },
                "towards-network-svc-end-port-name": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.svc-end-port-name",
                        0
                    ]
                },
                "towards-network-svc-end-port-rack": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.svc-end-port-rack",
                        0
                    ]
                },
                "towards-network-svc-end-port-shelf": {
                    "$arrayElemAt": [
                        "$topology-towards-network.tail-resource-entry.resource.svc-end-port-shelf",
                        0
                    ]
                }
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
            "$project": {
                "_id": 0,
                "clfi": 1,
                "lifecycle-state": 1,
                "type": 1,
                "towards-client-fiber-cable-name": 1,
                "towards-client-fiber-cable-strand-number": 1,
                "towards-client-type": 1,
                "towards-client-wiring-record-sequence-number": 1,
                "towards-client-svc-end-port-device": 1,
                "towards-client-svc-end-port-direction-used": 1,
                "towards-client-svc-end-port-lgx-name": 1,
                "towards-client-svc-end-port-name": 1,
                "towards-client-svc-end-port-rack": 1,
                "towards-client-svc-end-port-shelf": 1,
                "towards-network-fiber-cable-name": 1,
                "towards-network-roadm-circuit-pack-name" : 1,
                "towards-network-roadm-name": 1,
                "towards-network-roadm-port-name": 1,
                "towards-network-xponder-circuit-pack-name": 1,
                "towards-network-xponder-device": 1,
                "towards-network-xponder-port-name": 1,
                "towards-network-svc-end-port-device": 1,
                "towards-network-svc-end-port-direction-used": 1,
                "towards-network-svc-end-port-lgx-name": 1,
                "towards-network-svc-end-port-name": 1,
                "towards-network-svc-end-port-rack": 1,
                "towards-network-svc-end-port-shelf": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]

);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in fiber_tails_view:", db.fiber_tails_view.countDocuments());
