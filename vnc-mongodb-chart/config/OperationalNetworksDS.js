// OperationalNetworksDS_link

db.networks_v7_openroadm_network_view.drop();
db.createView(
    "OperationalNetworksDS_link_view", // name of view
    "OperationalNetworksDS_link", // Source collection
    [
        {
            $project: {
                _id: 0,
                "link-id": 1,
                "source-node": "$source.source-node",
                "source-tp": "$source.source-tp",
                "dest-node": "$destination.dest-node",
                "dest-tp": "$destination.dest-tp",
                "managed-state":
                    "$network-topology-ext:link-attributes-ext.link-status-attributes.managed-state",
                status:
                    "$network-topology-ext:link-attributes-ext.link-status-attributes.status",
                "admin-status":
                    "$network-topology-ext:link-ted.admin-status",
                clfi: "$network-topology-ext:link-ted.clfi",
                "oper-status":
                    "$network-topology-ext:link-ted.oper-status",
                "span-loss":
                    "$network-topology-ext:link-ted.span-loss"
            }
        },
        {
            $addFields: {
                etl_hash_id_str: {
                    $reduce: {
                        input: {
                            $map: {
                                input: {
                                    $objectToArray: "$$ROOT"
                                },
                                as: "kv",
                                in: {
                                    $toString: "$$kv.v"
                                }
                            }
                        },
                        initialValue: "",
                        in: {
                            "$concat": ["$$value", { $ifNull: ["$$this", ""] }]
                        }
                    }
                }
            }
        },
        {
            $project: {
                "link-id": 1,
                "source-node": 1,
                "source-tp": 1,
                "dest-node": 1,
                "dest-tp": 1,
                "managed-state": 1,
                status: 1,
                "admin-status": 1,
                clfi: 1,
                "oper-status": 1,
                "span-loss": 1,
                etl_hash_id: {
                    $toHashedIndexKey: "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString() + " Number of records in OperationalNetworksDS_link_view:", db.OperationalNetworksDS_link_view.countDocuments());
