// 1. services_base_view

db.services_base_view.drop();
db.createView(
    "services_base_view", // name of view
    "services", // Source collection
    [
        {
            $project: {
                _id: 0,
                "lifecycle_state": "$lifecycle-state",
                "service_layer": "$service-layer",
                "connection_type": "$connection-type",
                "common-id": 1,
                "service-name": 1,
                "source-tail-clfi": "$openroadm-service-ext:source-tail.network-tail-clfi",
                "destination-tail-clfi": "$openroadm-service-ext:destination-tail.network-tail-clfi",
                "a-end-clli": "$service-a-end.clli",
                "a-end-optic-type": "$service-a-end.optic-type",
                "a-end-service-rate": "$service-a-end.service-rate",
                "a-end-rx-direction-port-circuit-pack-name": { $arrayElemAt: [ "$service-a-end.rx-direction.port.port-circuit-pack-name", 0 ] },
                "a-end-rx-direction-port-device-name": { $arrayElemAt: [ "$service-a-end.rx-direction.port.port-device-name", 0 ] },
                "a-end-rx-direction-port-name": { $arrayElemAt: [ "$service-a-end.rx-direction.port.port-name", 0 ] },
                "a-end-rx-direction-port-rack": { $arrayElemAt: [ "$service-a-end.rx-direction.port.port-rack", 0 ] },
                "a-end-rx-direction-port-shelf": { $arrayElemAt: [ "$service-a-end.rx-direction.port.port-shelf", 0 ] },
                "a-end-rx-direction-port-type": { $arrayElemAt: [ "$service-a-end.rx-direction.port.port-type", 0 ] }, 
                "a-end-tx-direction-port-circuit-pack-name": { $arrayElemAt: [ "$service-a-end.tx-direction.port.port-circuit-pack-name", 0 ] },
                "a-end-tx-direction-port-device-name": { $arrayElemAt: [ "$service-a-end.tx-direction.port.port-device-name", 0 ] },
                "a-end-tx-direction-port-name": { $arrayElemAt: [ "$service-a-end.tx-direction.port.port-name", 0 ] },
                "a-end-tx-direction-port-rack": { $arrayElemAt: [ "$service-a-end.tx-direction.port.port-rack", 0 ] },
                "a-end-tx-direction-port-shelf": { $arrayElemAt: [ "$service-a-end.tx-direction.port.port-shelf", 0 ] },
                "a-end-tx-direction-port-type": { $arrayElemAt: [ "$service-a-end.tx-direction.port.port-type", 0 ] },
                "z-end-clli": "$service-z-end.clli",
                "z-end-optic-type": "$service-z-end.optic-type",
                "z-end-service-rate": "$service-z-end.service-rate",
                "z-end-rx-direction-port-circuit-pack-name": { $arrayElemAt: [ "$service-z-end.rx-direction.port.port-circuit-pack-name", 0 ] },
                "z-end-rx-direction-port-device-name": { $arrayElemAt: [ "$service-z-end.rx-direction.port.port-device-name", 0 ] },
                "z-end-rx-direction-port-name": { $arrayElemAt: [ "$service-z-end.rx-direction.port.port-name", 0 ] },
                "z-end-rx-direction-port-rack": { $arrayElemAt: [ "$service-z-end.rx-direction.port.port-rack", 0 ] },
                "z-end-rx-direction-port-shelf": { $arrayElemAt: [ "$service-z-end.rx-direction.port.port-shelf", 0 ] },
                "z-end-rx-direction-port-type": { $arrayElemAt: [ "$service-z-end.rx-direction.port.port-type", 0 ] },
                "z-end-tx-direction-port-circuit-pack-name": { $arrayElemAt: [ "$service-z-end.tx-direction.port.port-circuit-pack-name", 0 ] },
                "z-end-tx-direction-port-device-name": { $arrayElemAt: [ "$service-z-end.tx-direction.port.port-device-name", 0 ] },
                "z-end-tx-direction-port-name": { $arrayElemAt: [ "$service-z-end.tx-direction.port.port-name", 0 ] },
                "z-end-tx-direction-port-rack": { $arrayElemAt: [ "$service-z-end.tx-direction.port.port-rack", 0 ] },
                "z-end-tx-direction-port-shelf": { $arrayElemAt: [ "$service-z-end.tx-direction.port.port-shelf", 0 ] },
                "z-end-tx-direction-port-type": { $arrayElemAt: [ "$service-z-end.tx-direction.port.port-type", 0 ] }
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
            $project: {
                _id: 0,
                "common-id": 1,
                "service-name": 1,
                "lifecycle_state": 1,
                "service_layer": 1,
                "connection_type": 1,
                "source-tail-clfi": 1,
                "destination-tail-clfi": 1,
                "a-end-clli": 1,
                "a-end-optic-type": 1,
                "a-end-service-rate": 1,
                "a-end-rx-direction-port-circuit-pack-name": 1,
                "a-end-rx-direction-port-device-name": 1,
                "a-end-rx-direction-port-name": 1,
                "a-end-rx-direction-port-rack": 1,
                "a-end-rx-direction-port-shelf": 1,
                "a-end-rx-direction-port-type": 1,
                "a-end-tx-direction-port-circuit-pack-name": 1,
                "a-end-tx-direction-port-device-name": 1,
                "a-end-tx-direction-port-name": 1,
                "a-end-tx-direction-port-rack": 1,
                "a-end-tx-direction-port-shelf": 1,
                "a-end-tx-direction-port-type": 1,
                "z-end-clli": 1,
                "z-end-optic-type": 1,
                "z-end-service-rate": 1,
                "z-end-rx-direction-port-circuit-pack-name": 1,
                "z-end-rx-direction-port-device-name": 1,
                "z-end-rx-direction-port-name": 1,
                "z-end-rx-direction-port-rack": 1,
                "z-end-rx-direction-port-shelf": 1,
                "z-end-rx-direction-port-type": 1,
                "z-end-tx-direction-port-circuit-pack-name": 1,
                "z-end-tx-direction-port-device-name": 1,
                "z-end-tx-direction-port-name": 1,
                "z-end-tx-direction-port-rack": 1,
                "z-end-tx-direction-port-shelf": 1,
                "z-end-tx-direction-port-type": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in services_base_view:", db.services_base_view.countDocuments());

// 2. services_a_2_z_topology_view

db.services_a_2_z_topology_view.drop();
db.createView(
    "services_a_2_z_topology_view", // name of view
    "services", // Source collection
    [
        {
            $project: {
            _id: 0,
            "common-id": 1,
            "service-name": 1,
            "source-tail-clfi":
                "$openroadm-service-ext:source-tail.network-tail-clfi",
            "destination-tail-clfi":
                "$openroadm-service-ext:destination-tail.network-tail-clfi",
            topology: "$topology"
            }
        },
        {
            $unwind: {
            path: "$topology.aToZ"
            }
        },
        {
            $project: {
            common_id: "$common-id",
            service_name: "$service-name",
            source_tail_clfi: "$source-tail-clfi",
            destination_tail_clf:
                "$destination-tail-clfi",
            hop_type: "$topology.aToZ.hop-type",
            hop_id: "$topology.aToZ.id",
            resource_service_name:
                "$topology.aToZ.resource.service-name",
            resourceType:
                "$topology.aToZ.resourceType.type",
            device: "$topology.aToZ.device.node-id",
            circuit_pack_name:
                "$topology.aToZ.resource.port.circuit-pack-name",
            port_name:
                "$topology.aToZ.resource.port.port-name",
            interface_name:
                "$topology.aToZ.resource.interface-name",
            frequency:
                "$topology.aToZ.resource.nmc-ctp.frequency",
            width:
                "$topology.aToZ.resource.nmc-ctp.width",
            odu_rate:
                "$topology.aToZ.resource.odu.rate",
            trib_port_number:
                "$topology.aToZ.resource.odu.parent-odu-allocation.trib-port-number",
            trib_slots:
                "$topology.aToZ.resource.odu.parent-odu-allocation.trib-slots",
            oducn_n_rate:
                "$topology.aToZ.resource.odu.oducn-n-rate",
            opucn_trib_slots:
                "$topology.aToZ.resource.odu.parent-odu-allocation.opucn-trib-slots"
            }
        },
        {
            $addFields: {
            opucn_trib_slots: {
                $reduce: {
                input: "$opucn_trib_slots",
                initialValue: "",
                in: {
                    $cond: [
                    {
                        $eq: ["$$value", ""]
                    },
                    "$$this",
                    {
                        $concat: [ "$$value", "|", "$$this" ]
                    }
                    ]
                }
                }
            }
            }
        },
        {
            $addFields: {
            trib_slots: {
                $reduce: {
                input: "$trib_slots",
                initialValue: "",
                in: {
                    $cond: [
                    {
                        $eq: ["$$value", ""]
                    },
                    {
                        $toString: "$$this"
                    },
                    {
                        $concat: [ "$$value", "|", { $toString: "$$this" } ]
                    }
                    ]
                }
                }
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
            $project: {
            common_id: 1,
            service_name: 1,
            source_tail_clfi: 1,
            destination_tail_clf: 1,
            hop_type: 1,
            hop_id: 1,
            resource_service_name: 1,
            resourceType: 1,
            device: 1,
            circuit_pack_ame: 1,
            port_name: 1,
            interface_name: 1,
            frequency: 1,
            width: 1,
            odu_rate: 1,
            trib_port_number: 1,
            trib_slots: 1,
            oducn_n_rate: 1,
            opucn_trib_slots: 1,
            etl_hash_id: {
                $toHashedIndexKey: "$etl_hash_id_str"
            }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in services_a_2_z_topology_view:", db.services_a_2_z_topology_view.countDocuments());

// 3. services_a_2_z_network_topology_view

db.services_a_2_z_network_topology_view.drop();
db.createView(
    "services_a_2_z_network_topology_view", // name of view
    "services", // Source collection
    [
        {
            $match: {
                "lifecycle-state": "deployed"
            }
        },
        {
            $project: {
                _id: 0,
                "common-id": 1,
                "service-name": 1,
                "source-tail-clfi": "$openroadm-service-ext:source-tail.network-tail-clfi",
                "destination-tail-clfi": "$openroadm-service-ext:destination-tail.network-tail-clfi",
                "network-topology": "$network-topology"
            }
        },
        {
            $unwind: {
                path: "$network-topology.a-to-z"
            }
        },
        {
            $project: {
                "common-id": 1,
                "service-name": 1,
                "source-tail-clfi": 1,
                "destination-tail-clfi": 1,
                id: "$network-topology.a-to-z.id",
                "network-resource-type": "$network-topology.a-to-z.network-resource-type",
                "a-z-tp-id": "$network-topology.a-to-z.network-resource.tp-id",
                "a-z-tp-node-id": "$network-topology.a-to-z.network-resource.tp-node-id",
                "a-z-link-id": "$network-topology.a-to-z.network-resource.link-id",
                "a-z-link-network-id": "$network-topology.a-to-z.network-resource.link-network-id"
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
            $project: {
                "common-id": 1,
                "service-name": 1,
                "source-tail-clfi": 1,
                "destination-tail-clfi": 1,
                id: 1,
                "network-resource-type": 1,
                "a-z-tp-id": 1,
                "a-z-tp-node-id": 1,
                "a-z-link-id": 1,
                "a-z-link-network-id": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in services_a_2_z_network_topology_view:", db.services_a_2_z_network_topology_view.countDocuments());

// 4. services_z_2_a_topology_view

db.services_z_2_a_topology_view.drop();
db.createView(
    "services_z_2_a_topology_view", // name of view
    "services", // Source collection
    [
        {
            $project: {
            _id: 0,
            "common-id": 1,
            "service-name": 1,
            "source-tail-clfi":
                "$openroadm-service-ext:source-tail.network-tail-clfi",
            "destination-tail-clfi":
                "$openroadm-service-ext:destination-tail.network-tail-clfi",
            topology: "$topology"
            }
        },
        {
            $unwind: {
            path: "$topology.zToA"
            }
        },
        {
            $project: {
            common_id: "$common-id",
            service_name: "$service-name",
            source_tail_clfi: "$source-tail-clfi",
            destination_tail_clf:
                "$destination-tail-clfi",
            hop_type: "$topology.zToA.hop-type",
            hop_id: "$topology.zToA.id",
            resource_service_name:
                "$topology.zToA.resource.service-name",
            resourceType:
                "$topology.zToA.resourceType.type",
            device: "$topology.zToA.device.node-id",
            circuit_pack_name:
                "$topology.zToA.resource.port.circuit-pack-name",
            port_name:
                "$topology.zToA.resource.port.port-name",
            interface_name:
                "$topology.zToA.resource.interface-name",
            frequency:
                "$topology.zToA.resource.nmc-ctp.frequency",
            width:
                "$topology.zToA.resource.nmc-ctp.width",
            odu_rate:
                "$topology.zToA.resource.odu.rate",
            trib_port_number:
                "$topology.zToA.resource.odu.parent-odu-allocation.trib-port-number",
            trib_slots:
                "$topology.zToA.resource.odu.parent-odu-allocation.trib-slots",
            oducn_n_rate:
                "$topology.zToA.resource.odu.oducn-n-rate",
            opucn_trib_slots:
                "$topology.zToA.resource.odu.parent-odu-allocation.opucn-trib-slots"
            }
        },
        {
            $addFields: {
            opucn_trib_slots: {
                $reduce: {
                input: "$opucn_trib_slots",
                initialValue: "",
                in: {
                    $cond: [
                    {
                        $eq: ["$$value", ""]
                    },
                    "$$this",
                    {
                        $concat: [ "$$value", "|", "$$this" ]
                    }
                    ]
                }
                }
            }
            }
        },
        {
            $addFields: {
            trib_slots: {
                $reduce: {
                input: "$trib_slots",
                initialValue: "",
                in: {
                    $cond: [
                    {
                        $eq: ["$$value", ""]
                    },
                    {
                        $toString: "$$this"
                    },
                    {
                        $concat: [ "$$value", "|", { $toString: "$$this" } ]
                    }
                    ]
                }
                }
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
            $project: {
            common_id: 1,
            service_name: 1,
            source_tail_clfi: 1,
            destination_tail_clf: 1,
            hop_type: 1,
            hop_id: 1,
            resource_service_name: 1,
            resourceType: 1,
            device: 1,
            circuit_pack_ame: 1,
            port_name: 1,
            interface_name: 1,
            frequency: 1,
            width: 1,
            odu_rate: 1,
            trib_port_number: 1,
            trib_slots: 1,
            oducn_n_rate: 1,
            opucn_trib_slots: 1,
            etl_hash_id: {
                $toHashedIndexKey: "$etl_hash_id_str"
            }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in services_z_2_a_topology_view:", db.services_z_2_a_topology_view.countDocuments());

// 5. services_z_2_a_network_topology_view

db.services_z_2_a_network_topology_view.drop();
db.createView(
    "services_z_2_a_network_topology_view", // name of view
    "services", // Source collection
    [
        {
            $match: {
                "lifecycle-state": "deployed"
            }
        },
        {
            $project: {
                _id: 0,
                "common-id": 1,
                "service-name": 1,
                "source-tail-clfi": "$openroadm-service-ext:source-tail.network-tail-clfi",
                "destination-tail-clfi": "$openroadm-service-ext:destination-tail.network-tail-clfi",
                "a-end-clli": "$service-a-end.clli",
                "network-topology": "$network-topology"
            }
        },
        {
            $unwind: {
                path: "$network-topology.z-to-a"
            }
        },
        {
            $project: {
                "common-id": 1,
                "service-name": 1,
                "source-tail-clfi": 1,
                "destination-tail-clfi": 1,
                id: "$network-topology.z-to-a.id",
                "network-resource-type": "$network-topology.z-to-a.network-resource-type",
                "z-a-tp-id": "$network-topology.z-to-a.network-resource.tp-id",
                "z-a-tp-node-id": "$network-topology.z-to-a.network-resource.tp-node-id",
                "z-a-link-id": "$network-topology.z-to-a.network-resource.link-id",
                "z-a-link-network-id": "$network-topology.z-to-a.network-resource.link-network-id"
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
            $project: {
                "common-id": 1,
                "service-name": 1,
                "source-tail-clfi": 1,
                "destination-tail-clfi": 1,
                id: 1,
                "network-resource-type": 1,
                "z-a-tp-id": 1,
                "z-a-tp-node-id": 1,
                "z-a-link-id": 1,
                "z-a-link-network-id": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in services_z_2_a_network_topology_view:", db.services_z_2_a_network_topology_view.countDocuments());


// 6. services_otn_view

db.services_otn_view.drop();
db.createView(
    "services_otn_view", // name of view
    "services", // Source collection
    [
        {
            $match: {
                "lifecycle-state": "deployed"
            }
        },
        {
            $project: {
                _id: 0,
                "common-id": 1,
                "service-name": 1,
                "supporting-service-name": 1
            }
        },
        {
            $unwind: {
                path: "$supporting-service-name"
            }
        },
        {
            $project: {
                "common-id": 1,
                "service-name": 1,
                "supporting-service-name": 1
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
            $project: {
                "common_id": "$common-id",
                "service_name": "$service-name",
                "supporting_service_name": "$supporting-service-name" ,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in services_otn_view:", db.services_otn_view.countDocuments());
