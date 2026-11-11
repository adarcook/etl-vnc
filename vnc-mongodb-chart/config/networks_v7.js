// networks_v13_openroadm-network

db.networks_v13_openroadm_network_view.drop();
db.createView(
    "networks_v13_openroadm_network_view", // name of view
    "networks_v13_openroadm_network", // Source collection
    [
        {
            $unwind: {
                path: "$org-openroadm-network:node-capabilities.supported-xpdr-list.supported-xpdr",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 0,
                "node-id": 1,
                "lifecycle-state":
                    "$org-openroadm-common-network:lifecycle-state",
                "node-type":
                    "$org-openroadm-common-network:node-type",
                "network-ref": {
                    $arrayElemAt: [
                        "$supporting-node.network-ref",
                        0
                    ]
                },
                "node-ref": {
                    $arrayElemAt: [
                        "$supporting-node.node-ref",
                        0
                    ]
                },
                "equipment-available": {
                    $arrayElemAt: [
                        "$org-openroadm-network:node-capabilities.supported-xpdr-list.supported-xpdr.supported-operational-modes.supported-operational-mode.equipment-available",
                        0
                    ]
                },
                "equipment-capacity": {
                    $arrayElemAt: [
                        "$org-openroadm-network:node-capabilities.supported-xpdr-list.supported-xpdr.supported-operational-modes.supported-operational-mode.equipment-capacity",
                        0
                    ]
                },
                "operational-mode-id": {
                    $arrayElemAt: [
                        "$org-openroadm-network:node-capabilities.supported-xpdr-list.supported-xpdr.supported-operational-modes.supported-operational-mode.operational-mode-id",
                        0
                    ]
                }
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
                "node-id": 1,
                "lifecycle-state": 1,
                "node-type": 1,
                "network-ref": 1,
                "node-ref": 1,
                "equipment-available": 1,
                "equipment-capacity": 1,
                "operational-mode-id": 1,
                etl_hash_id: {
                    $toHashedIndexKey: "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in networks_v13_openroadm_network_view:", db.networks_v13_openroadm_network_view.countDocuments());


// networks_v13_openroadm_topology

db.networks_v13_openroadm_topology_view.drop();
db.createView(
    "networks_v13_openroadm_topology_view", // name of view
    "networks_v13_openroadm_topology", // Source collection
    [
        {
            $unwind: {
                path: "$ietf-network-topology:termination-point",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 0,
                "tp-type":
                    "$ietf-network-topology:termination-point.org-openroadm-common-network:tp-type",
                "tp-id":
                    "$ietf-network-topology:termination-point.tp-id",
                "node-id": 1,
                "lifecycle-state":
                    "$org-openroadm-common-network:lifecycle-state",
                "node-type":
                    "$org-openroadm-common-network:node-type",
                "srg-number":
                    "$org-openroadm-network-topology:srg-attributes.srg-number",
                "supporting-node-network-ref": {
                    $arrayElemAt: [
                        "$supporting-node.network-ref",
                        0
                    ]
                },
                "supporting-node-ref": {
                    $arrayElemAt: [
                        "$supporting-node.node-ref",
                        0
                    ]
                }
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
                "node-id": 1,
                "tp-type": 1,
                "tp-id": 1,
                "lifecycle-state": 1,
                "node-type": 1,
                "srg-number": 1,
                "supporting-node-network-ref": 1,
                "supporting-node-ref": 1,
                etl_hash_id: {
                    $toHashedIndexKey: "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in networks_v13_openroadm_topology_view:", db.networks_v13_openroadm_topology_view.countDocuments());

// networks_v13_openroadm_otn_topology

db.networks_v13_openroadm_otn_topology_view.drop();
db.createView(
    "networks_v13_openroadm_otn_topology_view", // name of view
    "networks_v13_openroadm_otn_topology", // Source collection
    [
        {
            $unwind: {
            path: "$ietf-network-topology:termination-point",
            preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
            _id: 0,
            "tp-type":
                "$ietf-network-topology:termination-point.org-openroadm-common-network:tp-type",
            "tp-id":
                "$ietf-network-topology:termination-point.tp-id",
            "node-id": 1,
            "lifecycle-state":
                "$org-openroadm-common-network:lifecycle-state",
            "node-type":
                "$org-openroadm-common-network:node-type",
            "srg-number":
                "$org-openroadm-network-topology:srg-attributes.srg-number",
            "supporting-node-network-ref": {
                $arrayElemAt: [
                "$supporting-node.network-ref",
                0
                ]
            },
            "supporting-node-ref": {
                $arrayElemAt: [
                "$supporting-node.node-ref",
                0
                ]
            }
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
            "node-id": 1,
            "tp-type": 1,
            "tp-id": 1,
            "lifecycle-state": 1,
            "node-type": 1,
            "srg-number": 1,
            "supporting-node-network-ref": 1,
            "supporting-node-ref": 1,
            etl_hash_id: {
                $toHashedIndexKey: "$etl_hash_id_str"
            }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in networks_v13_openroadm_otn_topology_view:", db.networks_v13_openroadm_otn_topology_view.countDocuments());

// network_v13_ietf_network_topology

db.networks_v13_ietf_network_topology_view.drop();
db.createView(
    "networks_v13_ietf_network_topology_view", // name of view
    "networks_v13_ietf_network_topology", // Source collection
    [
        {
            $project: {
                _id: 0,
                "link-id": "$link-id",
                "source-node": "$source.source-node",
                "source-tp": "$source.source-tp",
                "dest-node": "$destination.dest-node",
                "dest-tp": "$destination.dest-tp",
                "administrative-state":
                    "$org-openroadm-common-network:administrative-state",
                "administrative-group":
                    "$org-openroadm-common-network:administrative-group",
                clfi: "$org-openroadm-common-network:clfi",
                "lifecycle-state":
                    "$org-openroadm-common-network:lifecycle-state",
                "link-type":
                    "$org-openroadm-common-network:link-type",
                "operational-state":
                    "$org-openroadm-common-network:operational-state",
                "opposite-link":
                    "$org-openroadm-common-network:opposite-link",
                "auto-spanloss":
                    "$org-openroadm-network-topology:OMS-attributes.span.auto-spanloss",
                "engineered-spanloss":
                    "$org-openroadm-network-topology:OMS-attributes.span.engineered-spanloss",
                "spanloss-base":
                    "$org-openroadm-network-topology:OMS-attributes.span.spanloss-base",
                "spanloss-current":
                    "$org-openroadm-network-topology:OMS-attributes.span.spanloss-current",
                "spanloss-last-measured":
                    "$org-openroadm-network-topology:OMS-attributes.span.spanloss-last-measured"
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
                "administrative-state": 1,
                "administrative-group": 1,
                clfi: 1,
                "lifecycle-state": 1,
                "link-type": 1,
                "operational-state": 1,
                "opposite-link": 1,
                "auto-spanloss": 1,
                "engineered-spanloss": 1,
                "spanloss-base": 1,
                "spanloss-current": 1,
                "spanloss-last-measured": 1,
                etl_hash_id: {
                    $toHashedIndexKey: "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in networks_v13_ietf_network_topology_view:", db.networks_v13_ietf_network_topology_view.countDocuments());
