// 1. FiberCables

db.fiber_cables_base_view.drop();
db.createView(
    "fiber_cables_base_view", // name of view
    "fiber_cables", // Source collection
    [
        {
            $unwind:
            {
                path: "$fiber-cable-strand"
            }
        },
        {
            $project:
            {
                _id: 0,
                name: "$name",
                "tail-clfi": "$fiber-cable-strand.tail-clfi",
                "strand-number": "$fiber-cable-strand.strand-number",
                "allocation": "$fiber-cable-strand.allocation",
                "lifecycle-state": "$lifecycle-state",
                "s-clli": "$source.clli",
                "s-rack": "$source.rack",
                "s-shelf": "$fiber-cable-strand.source.shelf",
                "s-port": "$fiber-cable-strand.source.port",
                "d-clli": "$destination.clli",
                "d-rack": "$destination.rack",
                "d-shelf": "$fiber-cable-strand.destination.shelf",
                "d-port": "$fiber-cable-strand.destination.port"
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
                name: 1,
                "tail-clfi": 1,
                "strand-number": 1,
                "allocation": 1,
                "lifecycle-state": 1,
                "s-clli": 1,
                "s-rack": 1,
                "s-shelf": 1,
                "s-port": 1,
                "d-clli": 1,
                "d-rack": 1,
                "d-shelf": 1,
                "d-port": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in fiber_cables_base_view:", db.fiber_cables_base_view.countDocuments());
