// 1. devices_joined_rdm_view

db.devices_joined_rdm_view.drop();
db.createView(
    "devices_joined_rdm_view", // name of view
    "devices7", // Source collection
    [
        {
            $unionWith: {
            coll: "devices"
            }
        },
        {
            $match: {
            "org-openroadm-device.info.node-type": "rdm"
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_joined_rdm_view:", db.devices_joined_rdm_view.countDocuments());

// 2. devices_base_rdm_view

db.devices_base_rdm_view.drop();
db.createView(
    "devices_base_rdm_view", // name of view
    "devices_joined_rdm_view", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "rdm"
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "current-datetime": "$org-openroadm-device.info.current-datetime",
                "clli": "$org-openroadm-device.info.clli",
                "model": "$org-openroadm-device.info.model",
                "vendor": "$org-openroadm-device.info.vendor",
                "template": "$org-openroadm-device.info.template",
                "node-number": "$org-openroadm-device.info.node-number",
                "serial-id": "$org-openroadm-device.info.serial-id",
                "softwareVersion": "$org-openroadm-device.info.softwareVersion",
                "latitude": "$org-openroadm-device.info.geoLocation.latitude",
                "longitude": "$org-openroadm-device.info.geoLocation.longitude"
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
                "node-id": 1,
                "current-datetime": 1,
                "clli": 1,
                "model": 1,
                "vendor": 1,
                "node-number": 1,
                "serial-id": 1,
                "softwareVersion": 1,
                "template": 1,
                "latitude": 1,
                "longitude": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_base_rdm_view:", db.devices_base_rdm_view.countDocuments());


// 3. devices_circuit_packs_rdm_view

db.devices_circuit_packs_rdm_view.drop();
db.createView(
    "devices_circuit_packs_rdm_view", // name of view
    "devices_joined_rdm_view", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "rdm"
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.circuit-packs",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "template": "$org-openroadm-device.info.template",
                "circuit-pack-category": "$org-openroadm-device.circuit-packs.circuit-pack-category.type",
                "clli": "$org-openroadm-device.info.clli",
                "clei": "$org-openroadm-device.circuit-packs.clei",
                "circuit-pack-name": "$org-openroadm-device.circuit-packs.circuit-pack-name",
                "circuit-pack-product-code": "$org-openroadm-device.circuit-packs.circuit-pack-product-code",
                "circuit-pack-model": "$org-openroadm-device.circuit-packs.model",
                "circuit-pack-type": "$org-openroadm-device.circuit-packs.circuit-pack-type",
                "hardware-version": "$org-openroadm-device.circuit-packs.hardware-version",
                "software-load-version": "$org-openroadm-device.circuit-packs.software-load-version",
                "serial-id": "$org-openroadm-device.circuit-packs.serial-id",
                "product-code": "$org-openroadm-device.circuit-packs.product-code",
                "manufacture-date": "$org-openroadm-device.circuit-packs.manufacture-date",
                "is-pluggable-optics": "$org-openroadm-device.circuit-packs.is-pluggable-optics",
                "Shelf": "$org-openroadm-device.circuit-packs.shelf",
                "slot": "$org-openroadm-device.circuit-packs.slot",
                "subSlot": "$org-openroadm-device.circuit-packs.subSlot",
                "vendor": "$org-openroadm-device.circuit-packs.vendor",
                "type": "$org-openroadm-device.circuit-packs.type",
                "administrative-state": "$org-openroadm-device.circuit-packs.administrative-state",
                "equipment-state": "$org-openroadm-device.circuit-packs.equipment-state",
                "operational-state": "$org-openroadm-device.circuit-packs.operational-state"
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
                "node-id": 1,
                "template": 1,
                "circuit-pack-category": 1,
                "clli": 1,
                "clei": 1,
                "circuit-pack-name": 1,
                "circuit-pack-product-code": 1,
                "circuit-pack-model": 1,
                "circuit-pack-type": 1,
                "hardware-version": 1,
                "software-load-version": 1,
                "serial-id": 1,
                "product-code": 1,
                "manufacture-date": 1,
                "is-pluggable-optics": 1,
                "Shelf": 1,
                "slot": 1,
                "subSlot": 1,
                "vendor": 1,
                "type": 1,
                "administrative-state": 1,
                "equipment-state": 1,
                "operational-state": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_circuit_packs_rdm_view:", db.devices_circuit_packs_rdm_view.countDocuments());

// 4. devices_circuit_packs_cp_rdm_view

db.devices_circuit_packs_cp_rdm_view.drop();
db.createView(
    "devices_circuit_packs_cp_rdm_view", // name of view
    "devices_joined_rdm_view", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "rdm"
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.circuit-packs",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.circuit-packs.cp-slots"
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "circuit-pack-category": "$org-openroadm-device.circuit-packs.circuit-pack-category.type",
                "circuit-pack-name": "$org-openroadm-device.circuit-packs.circuit-pack-name",
                "Shelf": "$org-openroadm-device.circuit-packs.shelf",
                "slot": "$org-openroadm-device.circuit-packs.slot",
                "subSlot": "$org-openroadm-device.circuit-packs.subSlot",
                "cp-slots-name": "$org-openroadm-device.circuit-packs.cp-slots.slot-name",
                "cp-slots-type": "$org-openroadm-device.circuit-packs.cp-slots.slot-type",
                "provisioned-circuit-pack": "$org-openroadm-device.circuit-packs.cp-slots.provisioned-circuit-pack"
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
                "node-id": 1,
                "circuit-pack-category": 1,
                "circuit-pack-name": 1,
                "Shelf": 1,
                "slot": 1,
                "subSlot": 1,
                "cp-slots-name": 1,
                "cp-slots-type": 1,
                "provisioned-circuit-pack": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_circuit_packs_cp_rdm_view:", db.devices_circuit_packs_cp_rdm_view.countDocuments());


// 5. devices_physical_link_rdm_view

db.devices_physical_link_rdm_view.drop();
db.createView(
    "devices_physical_link_rdm_view", // name of view
    "devices_joined_rdm_view", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "rdm"
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.physical-link"
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "physical-link-name": "$org-openroadm-device.physical-link.physical-link-name",
                "s-circuit-pack-name": "$org-openroadm-device.physical-link.source.circuit-pack-name",
                "s-port-name": "$org-openroadm-device.physical-link.source.port-name",
                "d-circuit-pack-name": "$org-openroadm-device.physical-link.destination.circuit-pack-name",
                "d-port-name": "$org-openroadm-device.physical-link.destination.port-name"
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
                "node-id": 1,
                "physical-link-name": 1,
                "s-circuit-pack-name": 1,
                "s-port-name": 1,
                "d-circuit-pack-name": 1,
                "d-port-name": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_physical_link_rdm_view:", db.devices_physical_link_rdm_view.countDocuments());

// 6. devices_port_parents_rdm_view

db.devices_port_parents_rdm_view.drop();
db.createView(
    "devices_port_parents_rdm_view", // name of view
    "devices_joined_rdm_view", // Source collection
    [
        {
            $match: {
                "org-openroadm-device.info.node-type": "rdm"
            }
        },
        {
            $unwind: {
                path: "$org-openroadm-device.circuit-packs",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 0,
                "node-id":
                    "$org-openroadm-device.info.node-id",
                template:
                    "$org-openroadm-device.info.template",
                clli: "$org-openroadm-device.info.clli",
                "circuit-pack-name":
                    "$org-openroadm-device.circuit-packs.circuit-pack-name",
                "circuit-pack-product-code":
                    "$org-openroadm-device.circuit-packs.circuit-pack-product-code",
                "circuit-pack-mode":
                    "$org-openroadm-device.circuit-packs.circuit-pack-mode",
                "circuit-pack-type":
                    "$org-openroadm-device.circuit-packs.circuit-pack-type",
                "equipment-state":
                    "$org-openroadm-device.circuit-packs.equipment-state",
                Shelf:
                    "$org-openroadm-device.circuit-packs.Shelf",
                slot: "$org-openroadm-device.circuit-packs.slot",
                subSlot:
                    "$org-openroadm-device.circuit-packs.subSlot",
                vendor:
                    "$org-openroadm-device.circuit-packs.vendor",
                ports:
                    "$org-openroadm-device.circuit-packs.ports",
                "circuit-packs":
                    "$org-openroadm-device.circuit-packs"
            }
        },
        {
            $unwind: {
                path: "$ports",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                "node-id": "$node-id",
                template: "$template",
                clli: "$clli",
                "circuit-pack-name": "$circuit-pack-name",
                "circuit-pack-product-code":
                    "$circuit-pack-product-code",
                "circuit-pack-mode": "$circuit-pack-mode",
                "circuit-pack-type": "$circuit-pack-type",
                Shelf: "$Shelf",
                slot: "$slot",
                subSlot: "$subSlot",
                vendor: "$vendor",
                "parent-circuit-pack-slot-name":
                    "$circuit-packs.parent-circuit-pack.cp-slot-name",
                "parent-circuit-pack-name":
                    "$circuit-packs.parent-circuit-pack.circuit-pack-name",
                "administrative-state":
                    "$ports.administrative-state",
                "circuit-id": "$ports.circuit-id",
                "interface-name": {
                    $arrayElemAt: [
                        "$ports.interfaces.interface-name",
                        0
                    ]
                },
                "logical-connection-point":
                    "$ports.logical-connection-point",
                "port-direction": "$ports.port-direction",
                "port-name": "$ports.port-name",
                "port-qual": "$ports.port-qual",
                "port-type": "$ports.port-type"
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
                template: 1,
                clli: 1,
                "circuit-pack-name": 1,
                "circuit-pack-product-code": 1,
                "circuit-pack-mode": 1,
                "circuit-pack-type": 1,
                Shelf: 1,
                slot: 1,
                subSlot: 1,
                vendor: 1,
                "parent-circuit-pack-slot-name": 1,
                "parent-circuit-pack-name": 1,
                "administrative-state": 1,
                "circuit-id": 1,
                "interface-name": 1,
                "logical-connection-point": 1,
                "port-direction": 1,
                "port-name": 1,
                "port-qual": 1,
                "port-type": 1,
                etl_hash_id: {
                    $toHashedIndexKey: "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_port_parents_rdm_view:", db.devices_port_parents_rdm_view.countDocuments());

// 7. devices_interfaces_rdm_view

db.devices_interfaces_rdm_view.drop();
db.createView(
    "devices_interfaces_rdm_view", // name of view
    "devices_joined_rdm_view", // Source collection
    [
        {
            $match: {
                "org-openroadm-device.info.node-type": "rdm"
            }
        },
        {
            $unwind: {
                path: "$org-openroadm-device.interface",
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $project:
            /**
             * specifications: The fields to
             *   include or exclude.
             */
            {
                "node-id":
                    "$org-openroadm-device.info.node-id",
                interface:
                    "$org-openroadm-device.interface"
            }
        },
        {
            $project: {
                _id: 0,
                "node-id": 1,
                name: "$interface.name",
                description: "$interface.description",
                "administrative-state":
                    "$interface.administrative-state",
                "operationale-state":
                    "$interface.operational-state",
                "circuit-id": "$interface.circuit-id",
                "supporting-circuit-pack-name":
                    "$interface.supporting-circuit-pack-name",
                "supporting-interface":
                    "$interface.supporting-interface",
                "supporting-port":
                    "$interface.supporting-port",
                "mc-ttp-center-freq":
                    "$interface.mc-ttp.center-freq",
                "mc-ttp-max-freq":
                    "$interface.mc-ttp.max-freq",
                "mc-ttp-min-freq":
                    "$interface.mc-ttp.min-freq",
                "mc-ttp-slot-width":
                    "$interface.mc-ttp.slot-width",
                "nmc_ctp_frequency": "$interface.nmc-ctp.frequency",
                "nmc_ctp_width": "$interface.nmc-ctp.width",
                type: "$interface.type",
                "ethernet-auto-negotiation":
                    "$interface.ethernet.auto-negotiation",
                "ethernet-duplex":
                    "$interface.ethernet.duplex",
                "ethernet-speed":
                    "$interface.ethernet.speed",
                "ethernet-fec": "$interface.ethernet.fec",
                "ethernet-mtu": "$interface.ethernet.mtu"
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
                name: 1,
                description: 1,
                "administrative-state": 1,
                "operationale-state": 1,
                "circuit-id": 1,
                "supporting-circuit-pack-name": 1,
                "supporting-interface": 1,
                "supporting-port": 1,
                "mc-ttp-center-freq": 1,
                "mc-ttp-max-freq": 1,
                "mc-ttp-min-freq": 1,
                "mc-ttp-slot-width": 1,
                "nmc_ctp_frequency": 1,
                "nmc_ctp_width": 1,
                type: 1,
                "ethernet-auto-negotiation": 1,
                "ethernet-duplex": 1,
                "ethernet-speed": 1,
                "ethernet-fec": 1,
                "ethernet-mtu": 1,
                etl_hash_id: {
                    $toHashedIndexKey: "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_interfaces_rdm_view:", db.devices_interfaces_rdm_view.countDocuments());


// 8. devices_interfaces_oms_rdm_view

db.devices_interfaces_oms_rdm_view.drop();
db.createView(
    "devices_interfaces_oms_rdm_view", // name of view
    "devices_joined_rdm_view", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "rdm"
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.interface"
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "name": "$org-openroadm-device.interface.name",
                "supporting-circuit-pack-name": "$org-openroadm-device.interface.supporting-circuit-pack-name",
                "supporting-interface": "$org-openroadm-device.interface.supporting-interface",
                "supporting-port": "$org-openroadm-device.interface.supporting-port",
                "type": "$org-openroadm-device.interface.type"
            }
        },
        {
            "$match": {
                "name": {
                    "$regex": "oms-"
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
                "node-id": 1,
                "name": 1,
                "supporting-circuit-pack-name": 1,
                "supporting-interface": 1,
                "supporting-port": 1,
                "type": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_interfaces_oms_rdm_view:", db.devices_interfaces_oms_rdm_view.countDocuments());

// 9. devices_interfaces_ots_rdm_view

db.devices_interfaces_ots_rdm_view.drop();
db.createView(
    "devices_interfaces_ots_rdm_view", // name of view
    "devices_joined_rdm_view", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "rdm"
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.interface"
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "name": "$org-openroadm-device.interface.name",
                "supporting-circuit-pack-name": "$org-openroadm-device.interface.supporting-circuit-pack-name",
                "supporting-interface": "$org-openroadm-device.interface.supporting-interface",
                "supporting-port": "$org-openroadm-device.interface.supporting-port",
                "type": "$org-openroadm-device.interface.type"
            }
        },
        {
            "$match": {
                "name": {
                    "$regex": "ots-"
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
                "node-id": 1,
                "name": 1,
                "supporting-circuit-pack-name": 1,
                "supporting-interface": 1,
                "supporting-port": 1,
                "type": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_interfaces_ots_rdm_view:", db.devices_interfaces_ots_rdm_view.countDocuments());

// 10. devices_shelf_rdm_view

db.devices_shelf_rdm_view.drop();
db.createView(
    "devices_shelf_rdm_view", // name of view
    "devices_joined_rdm_view", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "rdm"
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.shelves",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.shelves.slots",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "administrative-state": "$org-openroadm-device.shelves.administrative-state",
                "vendor": "$org-openroadm-device.shelves.vendor",
                "model": "$org-openroadm-device.shelves.model",
                "hardware-version": "$org-openroadm-device.shelves.hardware-version",
                "operational-state": "$org-openroadm-device.shelves.operational-state",
                "serial-id": "$org-openroadm-device.shelves.serial-id",
                "rack": "$org-openroadm-device.shelves.rack",
                "shelf-name": "$org-openroadm-device.shelves.shelf-name",
                "shelf-position": "$org-openroadm-device.shelves.shelf-position",
                "shelf-type": "$org-openroadm-device.shelves.shelf-type",
                "provisioned-circuit-pack": "$org-openroadm-device.shelves.slots.provisioned-circuit-pack",
                "slot-name": "$org-openroadm-device.shelves.slots.slot-name",
                "slot-status": "$org-openroadm-device.shelves.slots.slot-status"
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
                "node-id": 1,
                "administrative-state": 1,
                "vendor": 1,
                "model": 1,
                "hardware-version": 1,
                "operational-state": 1,
                "serial-id": 1,
                "rack": 1,
                "shelf-name": 1,
                "shelf-position": 1,
                "shelf-type": 1,
                "provisioned-circuit-pack": 1,
                "slot-name": 1,
                "slot-status": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_shelf_rdm_view:", db.devices_shelf_rdm_view.countDocuments());

// 11. devices_srg_rdm_view

db.devices_srg_rdm_view.drop();
db.createView(
    "devices_srg_rdm_view", // name of view
    "devices_joined_rdm_view", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "rdm"
            }
        },
        {
            "$project": {
                "_id": 0,
                "node_id": "$org-openroadm-device.info.node-id",
                "openroadm_version": "$org-openroadm-device.info.openroadm-version",
                "version": "$org-openroadm-device.info.openroadm-version",
                "shared-risk-group": "$org-openroadm-device.shared-risk-group"
            }
        },
        {
            "$unwind": {
                "path": "$shared-risk-group",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$unwind": {
                "path": "$shared-risk-group.circuit-packs",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$project": {
                "node_id": 1,
                "openroadm_version": 1,
                "circuit_pack_name": "$shared-risk-group.circuit-packs.circuit-pack-name",
                "circuit_pack_name_index": "$shared-risk-group.circuit-packs.index",
                "srg_number": "$shared-risk-group.srg-number",
                "max_add_drop_ports": "$shared-risk-group.max-add-drop-ports",
                "current_provisioned_add_drop_ports": "$shared-risk-group.current-provisioned-add-drop-ports",
                "wavelength_duplication": "$shared-risk-group.wavelength-duplication",
                "center_freq_granularity": "$shared-risk-group.mc-capabilities.center-freq-granularity",
                "slot_width_granularity": "$shared-risk-group.mc-capabilities.slot-width-granularity",
                "mc_capabilities_max_slots": "$shared-risk-group.mc-capabilities.max-slots",
                "mc_capabilities_min_slots": "$shared-risk-group.mc-capabilities.min-slots",
                "mc_capability_profile_name": {
                    "$arrayElemAt": ["$shared-risk-group.mc-capability-profile-mc_capability_profile_name", 0]
                },
                "lifecycle_state": "$shared-risk-group.lifecycle-state"

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
                "node_id": 1,
                "openroadm_version": 1,
                "circuit_pack_name": 1,
                "circuit_pack_name_index": 1,
                "srg_number": 1,
                "max_add_drop_ports": 1,
                "current_provisioned_add_drop_ports": 1,
                "wavelength_duplication": 1,
                "center_freq_granularity": 1,
                "slot_width_granularity": 1,
                "mc_capabilities_max_slots": 1,
                "mc_capabilities_min_slots": 1,
                "mc_capability_profile_name": 1,
                "lifecycle_state": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_srg_rdm_view:", db.devices_srg_rdm_view.countDocuments());

// 12. devices_interfaces_xpdr_view

db.devices_interfaces_xpdr_view.drop();
db.createView(
    "devices_interfaces_xpdr_view", // name of view
    "devices7", // Source collection
    [
        {
            $match: {
                "org-openroadm-device.info.node-type": "xpdr"
            }
        },
        {
            $unwind: {
                path: "$org-openroadm-device.interface",
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $project:
            /**
             * specifications: The fields to
             *   include or exclude.
             */
            {
                "node-id":
                    "$org-openroadm-device.info.node-id",
                interface:
                    "$org-openroadm-device.interface"
            }
        },
        {
            $project: {
                _id: 0,
                "node-id": 1,
                name: "$interface.name",
                description: "$interface.description",
                "administrative-state":
                    "$interface.administrative-state",
                "operationale-state":
                    "$interface.operational-state",
                "circuit-id": "$interface.circuit-id",
                "supporting-circuit-pack-name":
                    "$interface.supporting-circuit-pack-name",
                "supporting-interface":
                    "$interface.supporting-interface",
                "supporting-port":
                    "$interface.supporting-port",
                "mc-ttp-center-freq":
                    "$interface.mc-ttp.center-freq",
                "mc-ttp-max-freq":
                    "$interface.mc-ttp.max-freq",
                "mc-ttp-min-freq":
                    "$interface.mc-ttp.min-freq",
                "mc-ttp-slot-width":
                    "$interface.mc-ttp.slot-width",
                "nmc_ctp_frequency": "$interface.nmc-ctp.frequency",
                "nmc_ctp_width": "$interface.nmc-ctp.width",
                type: "$interface.type",
                "ethernet-auto-negotiation":
                    "$interface.ethernet.auto-negotiation",
                "ethernet-duplex":
                    "$interface.ethernet.duplex",
                "ethernet-speed":
                    "$interface.ethernet.speed",
                "ethernet-fec": "$interface.ethernet.fec",
                "ethernet-mtu": "$interface.ethernet.mtu"
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
                name: 1,
                description: 1,
                "administrative-state": 1,
                "operationale-state": 1,
                "circuit-id": 1,
                "supporting-circuit-pack-name": 1,
                "supporting-interface": 1,
                "supporting-port": 1,
                "mc-ttp-center-freq": 1,
                "mc-ttp-max-freq": 1,
                "mc-ttp-min-freq": 1,
                "mc-ttp-slot-width": 1,
                "nmc_ctp_frequency": 1,
                "nmc_ctp_width": 1,
                type: 1,
                "ethernet-auto-negotiation": 1,
                "ethernet-duplex": 1,
                "ethernet-speed": 1,
                "ethernet-fec": 1,
                "ethernet-mtu": 1,
                etl_hash_id: {
                    $toHashedIndexKey: "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_interfaces_xpdr_view:", db.devices_interfaces_xpdr_view.countDocuments());

// 13. devices_shelf_xpdr_view

db.devices_shelf_xpdr_view.drop();
db.createView(
    "devices_shelf_xpdr_view", // name of view
    "devices", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "xpdr"
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.shelves",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.shelves.slots",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "administrative-state": "$org-openroadm-device.shelves.administrative-state",
                "vendor": "$org-openroadm-device.shelves.vendor",
                "model": "$org-openroadm-device.shelves.model",
                "hardware-version": "$org-openroadm-device.shelves.hardware-version",
                "operational-state": "$org-openroadm-device.shelves.operational-state",
                "serial-id": "$org-openroadm-device.shelves.serial-id",
                "rack": "$org-openroadm-device.shelves.rack",
                "shelf-name": "$org-openroadm-device.shelves.shelf-name",
                "shelf-position": "$org-openroadm-device.shelves.shelf-position",
                "shelf-type": "$org-openroadm-device.shelves.shelf-type",
                "provisioned-circuit-pack": "$org-openroadm-device.shelves.slots.provisioned-circuit-pack",
                "label": "$org-openroadm-device.shelves.slots.label",
                "slot-name": "$org-openroadm-device.shelves.slots.slot-name",
                "slot-status": "$org-openroadm-device.shelves.slots.slot-status"
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
                "node-id": 1,
                "administrative-state": 1,
                "vendor": 1,
                "model": 1,
                "hardware-version": 1,
                "operational-state": 1,
                "serial-id": 1,
                "rack": 1,
                "shelf-name": 1,
                "shelf-position": 1,
                "shelf-type": 1,
                "provisioned-circuit-pack": 1,
                "label": 1,
                "slot-name": 1,
                "slot-status": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_shelf_xpdr_view:", db.devices_shelf_xpdr_view.countDocuments());

// 14. devices_degree_rdm_view

db.devices_degree_rdm_view.drop();
db.createView(
    "devices_degree_rdm_view", // name of view
    "devices_joined_rdm_view", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "rdm"
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.degree",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.degree.connection-ports",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "degree-number": "$org-openroadm-device.degree.degree-number",
                "circuit-pack-name": "$org-openroadm-device.degree.connection-ports.circuit-pack-name",
                "port-name": "$org-openroadm-device.degree.connection-ports.port-name",
                "max-wavelengths": "$org-openroadm-device.degree.max-wavelengths",
                "center-freq-granularity": "$org-openroadm-device.degree.mc-capabilities.center-freq-granularity",
                "max-slots": "$org-openroadm-device.degree.mc-capabilities.max-slots",
                "min-slots": "$org-openroadm-device.degree.mc-capabilities.min-slots",
                "slot-width-granularity": "$org-openroadm-device.degree.mc-capabilities.slot-width-granularity",
                "otdr-port-circuit-pack-name": "$org-openroadm-device.degree.otdr-port.circuit-pack-name",
                "otdr-port-port-name": "$org-openroadm-device.degree.otdr-port.port-name",
                "lifecycle-state": "$org-openroadm-device.degree.lifecycle-state"
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
                "node-id": 1,
                "degree-number": 1,
                "circuit-pack-name": 1,
                "port-name": 1,
                "max-wavelengths": 1,
                "center-freq-granularity": 1,
                "max-slots": 1,
                "min-slots": 1,
                "slot-width-granularity": 1,
                "otdr-port-circuit-pack-name": 1,
                "otdr-port-port-name": 1,
                "lifecycle-state": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_degree_rdm_view:", db.devices_degree_rdm_view.countDocuments());

// 15. devices_base_xpdr_view

db.devices_base_xpdr_view.drop();
db.createView(
    "devices_base_xpdr_view", // name of view
    "devices", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "xpdr"
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "current-datetime": "$org-openroadm-device.info.current-datetime",
                "clli": "$org-openroadm-device.info.clli",
                "model": "$org-openroadm-device.info.model",
                "vendor": "$org-openroadm-device.info.vendor",
                "template": "$org-openroadm-device.info.template",
                "node-number": "$org-openroadm-device.info.node-number",
                "serial-id": "$org-openroadm-device.info.serial-id",
                softwareVersion: "$org-openroadm-device.info.softwareVersion",
                "latitude": "$org-openroadm-device.info.geoLocation.latitude",
                "longitude": "$org-openroadm-device.info.geoLocation.longitude"
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
                "node-id": 1,
                "current-datetime": 1,
                "clli": 1,
                "model": 1,
                "vendor": 1,
                "template": 1,
                "node-number": 1,
                "serial-id": 1,
                softwareVersion: 1,
                "latitude": 1,
                "longitude": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_base_xpdr_view:", db.devices_base_xpdr_view.countDocuments());

// 16. devices_circuit_packs_xpdr_view

db.devices_circuit_packs_xpdr_view.drop();
db.createView(
    "devices_circuit_packs_xpdr_view", // name of view
    "devices", // Source collection
    [
        {
            $match: {
                "org-openroadm-device.info.node-type": "xpdr"
            }
        },
        {
            $unwind: {
                path: "$org-openroadm-device.circuit-packs",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "circuit-pack-category": "$org-openroadm-device.circuit-packs.circuit-pack-category.type",
                "circuit-pack-name": "$org-openroadm-device.circuit-packs.circuit-pack-name",
                "circuit-pack-product-code": "$org-openroadm-device.circuit-packs.circuit-pack-product-code",
                "circuit-pack-type": "$org-openroadm-device.circuit-packs.circuit-pack-type",
                clei: "$org-openroadm-device.circuit-packs.clei",
                "equipment-state": "$org-openroadm-device.circuit-packs.equipment-state",
                "operational-state": "$org-openroadm-device.circuit-packs.operational-state",
                "hardware-version": "$org-openroadm-device.circuit-packs.hardware-version",
                model: "$org-openroadm-device.circuit-packs.model",
                "product-code": "$org-openroadm-device.circuit-packs.product-code",
                "serial-id": "$org-openroadm-device.circuit-packs.serial-id",
                "software-load-version": "$org-openroadm-device.circuit-packs.software-load-version",
                vendor: "$org-openroadm-device.circuit-packs.vendor",
                shelf: "$org-openroadm-device.circuit-packs.shelf",
                slot: "$org-openroadm-device.circuit-packs.slot",
                "subSlot": "$org-openroadm-device.circuit-packs.subSlot",
                type: "$org-openroadm-device.circuit-packs.type"
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
                "circuit-pack-category": 1,
                "circuit-pack-name": 1,
                "circuit-pack-product-code": 1,
                "circuit-pack-type": 1,
                clei: 1,
                "equipment-state": 1,
                "hardware-version": 1,
                "operational-state": 1,
                model: 1,
                "product-code": 1,
                "serial-id": 1,
                shelf: 1,
                slot: 1,
                "subSlot": 1,
                "software-load-version": 1,
                vendor: 1,
                type: 1,
                etl_hash_id: {
                    $toHashedIndexKey: "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices_circuit_packs_xpdr_view:", db.devices_circuit_packs_xpdr_view.countDocuments());

// 17. devices7_base_xpdr_view

db.devices7_base_xpdr_view.drop();
db.createView(
    "devices7_base_xpdr_view", // name of view
    "devices7", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "xpdr"
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "current-datetime": "$org-openroadm-device.info.current-datetime",
                "clli": "$org-openroadm-device.info.clli",
                "model": "$org-openroadm-device.info.model",
                "vendor": "$org-openroadm-device.info.vendor",
                "template": "$org-openroadm-device.info.template",
                "node-number": "$org-openroadm-device.info.node-number",
                "serial-id": "$org-openroadm-device.info.serial-id",
                "software-build": "$org-openroadm-device.info.software-build",
                softwareVersion: "$org-openroadm-device.info.softwareVersion",
                "latitude": "$org-openroadm-device.info.geoLocation.latitude",
                "longitude": "$org-openroadm-device.info.geoLocation.longitude"
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
                "node-id": 1,
                "current-datetime": 1,
                "clli": 1,
                "model": 1,
                "vendor": 1,
                "template": 1,
                "node-number": 1,
                "serial-id": 1,
                "software-build": 1,
                softwareVersion: 1,
                "latitude": 1,
                "longitude": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices7_base_xpdr_view:", db.devices7_base_xpdr_view.countDocuments());

// 18. devices7_shelf_xpdr_view

db.devices7_shelf_xpdr_view.drop();
db.createView(
    "devices7_shelf_xpdr_view", // name of view
    "devices7", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "xpdr"
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.shelves",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.shelves.slots",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "administrative-state": "$org-openroadm-device.shelves.administrative-state",
                "vendor": "$org-openroadm-device.shelves.vendor",
                "model": "$org-openroadm-device.shelves.model",
                "hardware-version": "$org-openroadm-device.shelves.hardware-version",
                "operational-state": "$org-openroadm-device.shelves.operational-state",
                "serial-id": "$org-openroadm-device.shelves.serial-id",
                "rack": "$org-openroadm-device.shelves.rack",
                "shelf-name": "$org-openroadm-device.shelves.shelf-name",
                "shelf-position": "$org-openroadm-device.shelves.shelf-position",
                "shelf-type": "$org-openroadm-device.shelves.shelf-type",
                "provisioned-circuit-pack": "$org-openroadm-device.shelves.slots.provisioned-circuit-pack",
                "label": "$org-openroadm-device.shelves.slots.label",
                "slot-name": "$org-openroadm-device.shelves.slots.slot-name",
                "slot-status": "$org-openroadm-device.shelves.slots.slot-status"
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
                "node-id": 1,
                "administrative-state": 1,
                "vendor": 1,
                "model": 1,
                "hardware-version": 1,
                "operational-state": 1,
                "serial-id": 1,
                "rack": 1,
                "shelf-name": 1,
                "shelf-position": 1,
                "shelf-type": 1,
                "provisioned-circuit-pack": 1,
                "label": 1,
                "slot-name": 1,
                "slot-status": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices7_shelf_xpdr_view:", db.devices7_shelf_xpdr_view.countDocuments());

// 19. devices7_circuit_pack_xpdr_view

db.devices7_circuit_pack_xpdr_view.drop();
db.createView(
    "devices7_circuit_pack_xpdr_view", // name of view
    "devices7", // Source collection
    [
        {
            "$match": {
                "org-openroadm-device.info.node-type": "xpdr"
            }
        },
        {
            "$unwind": {
                "path": "$org-openroadm-device.circuit-packs",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$project": {
                "_id": 0,
                "node-id": "$org-openroadm-device.info.node-id",
                "template": "$org-openroadm-device.info.template",
                "clli": "$org-openroadm-device.info.clli",
                "circuit-pack-name": "$org-openroadm-device.circuit-packs.circuit-pack-name",
                "circuit-pack-product-code": "$org-openroadm-device.circuit-packs.circuit-pack-product-code",
                "circuit-pack-model": "$org-openroadm-device.circuit-packs.circuit-pack-model",
                "circuit-pack-type": "$org-openroadm-device.circuit-packs.circuit-pack-type",
                "faceplate-label": "$org-openroadm-device.circuit-packs.faceplate-label",
                "hardware-version": "$org-openroadm-device.circuit-packs.hardware-version",
                "model": "$org-openroadm-device.circuit-packs.model",
                "serial-id": "$org-openroadm-device.circuit-packs.serial-id",
                "product-code": "$org-openroadm-device.circuit-packs.product-code",
                "serial-id": "$org-openroadm-device.circuit-packs.serial-id",
                "Shelf": "$org-openroadm-device.circuit-packs.Shelf",
                "slot": "$org-openroadm-device.circuit-packs.slot",
                "subSlot": "$org-openroadm-device.circuit-packs.subSlot",
                "vendor": "$org-openroadm-device.circuit-packs.vendor",
                "ports": "$org-openroadm-device.circuit-packs.ports",
                "circuit-packs": "$org-openroadm-device.circuit-packs"
            }
        },
        {
            "$unwind": {
                "path": "$ports"
            }
        },
        {
            "$project": {
                "node-id": 1,
                "template": 1,
                "clli": 1,
                "circuit-pack-name": 1,
                "circuit-pack-product-code": 1,
                "circuit-pack-model": 1,
                "circuit-pack-type": 1,
                "faceplate-label": 1,
                "hardware-version": 1,
                "model": 1,
                "serial-id": 1,
                "product-code": 1,
                "serial-id": 1,
                "Shelf": 1,
                "slot": 1,
                "subSlot": 1,
                "vendor": 1,
                "port-faceplate-label": "$ports.faceplate-label",
                "port-direction": "$ports.port-direction",
                "port-name": "$ports.port-name",
                "port-type": "$ports.port-type"
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
                "node-id": 1,
                "template": 1,
                "clli": 1,
                "circuit-pack-name": 1,
                "circuit-pack-product-code": 1,
                "circuit-pack-model": 1,
                "circuit-pack-type": 1,
                "faceplate-label": 1,
                "hardware-version": 1,
                "model": 1,
                "serial-id": 1,
                "product-code": 1,
                "serial-id": 1,
                "Shelf": 1,
                "slot": 1,
                "subSlot": 1,
                "vendor": 1,
                "port-faceplate-label": 1,
                "port-direction": 1,
                "port-name": 1,
                "port-type": 1,
                "etl_hash_id": {
                    "$toHashedIndexKey": "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString().replace('Z', '+0000') + " Number of records in devices7_circuit_pack_xpdr_view:", db.devices7_circuit_pack_xpdr_view.countDocuments());
