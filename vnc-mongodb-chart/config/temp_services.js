// temp_services_base_view
db.temp_services_base_view.drop();
db.createView(
    "temp_services_base_view", // name of view
    "temp_services", // Source collection
    [
        {
            $project: {
                _id: 0,
                common_id: "$common-id",
                due_date: "$due-date",
                lifecycle_state: "$lifecycle-state",
                connection_type: "$connection-type",
                is_bandwidth_locked: "$is-bandwidth-locked",
                resource_status: "$resource-status",
                service_layer: "$service-layer",
                a_clli: "$service-a-end.clli",
                a_optic_type: "$service-a-end.optic-type",
                a_service_format: "$service-a-end.service-format",
                a_service_rate: "$service-a-end.service-rate",
                a_rx_port_circuit_pack_name: "$service-a-end.rx-direction.port.port-circuit-pack-name",
                a_rx_port_circuit_device_name: "$service-a-end.rx-direction.port.port-device-name",
                a_rx_port_type: "$service-a-end.rx-direction.port.port-type",
                a_tx_port_circuit_pack_name: "$service-a-end.tx-direction.port.port-circuit-pack-name",
                a_tx_port_circuit_device_name: "$service-a-end.tx-direction.port.port-device-name",
                a_tx_port_type: "$service-a-end.tx-direction.port.port-type",
                z_clli: "$service-z-end.clli",
                z_optic_type: "$service-z-end.optic-type",
                z_service_format: "$service-z-end.service-format",
                z_service_rate: "$service-z-end.service-rate",
                z_rx_port_circuit_pack_name: "$service-z-end.rx-direction.port.port-circuit-pack-name",
                z_rx_port_circuit_device_name: "$service-z-end.rx-direction.port.port-device-name",
                z_rx_port_type: "$service-z-end.rx-direction.port.port-type",
                z_tx_port_circuit_pack_name: "$service-z-end.tx-direction.port.port-circuit-pack-name",
                z_tx_port_circuit_device_name: "$service-z-end.tx-direction.port.port-device-name",
                z_tx_port_type: "$service-z-end.tx-direction.port.port-type"
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
                            $concat: [
                                "$$value",
                                {
                                    $ifNull: ["$$this", ""]
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: {
                common_id: 1,
                connection_type: 1,
                due_date: 1,
                lifecycle_state: 1,
                is_bandwidth_locked: 1,
                resource_status: 1,
                service_layer: 1,
                a_clli: 1,
                a_optic_type: 1,
                a_service_format: 1,
                a_service_rate: 1,
                a_rx_port_circuit_pack_name: 1,
                a_rx_port_circuit_device_name: 1,
                a_rx_port_type: 1,
                a_tx_port_circuit_pack_name: 1,
                a_tx_port_circuit_device_name: 1,
                a_tx_port_type: 1,
                z_clli: 1,
                z_optic_type: 1,
                z_service_format: 1,
                z_service_rate: 1,
                z_rx_port_circuit_pack_name: 1,
                z_rx_port_circuit_device_name: 1,
                z_rx_port_type: 1,
                z_tx_port_circuit_pack_name: 1,
                z_tx_port_circuit_device_name: 1,
                z_tx_port_type: 1,
                etl_hash_id: {
                    $toHashedIndexKey: "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString() + " Number of records in temp_services_base_view:", db.temp_services_base_view.countDocuments());

// temp_services_a_2_z_topology_view
db.temp_services_a_2_z_topology_view.drop();
db.createView(
    "temp_services_a_2_z_topology_view", // name of view
    "temp_services", // Source collection
    [
        {
            $project: {
                _id: 0,
                common_id: "$common-id",
                topology: "$topology"
            }
        },
        {
            $unwind: {
                path: "$topology.aToZ",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                common_id: 1,
                id: "$topology.aToZ.id",
                device_node_id: "$topology.aToZ.device.node-id",
                hop_type: "$topology.aToZ.hop-type",
                resource_interface_name: "$topology.aToZ.resource.interface-name",
                resource_type: "$topology.aToZ.resource.type",
                resourcetype: "$topology.aToZ.resourceType.type",
                circuit_pack_name: "$topology.aToZ.resource.port.circuit-pack-name",
                port_name: "$topology.aToZ.resource.port.port-name",
                service_name: "$topology.aToZ.resource.service-name",
                nmc_ctp_frequency: "$topology.aToZ.resource.nmc-ctp.frequency",
                nmc_ctp_width: "$topology.aToZ.resource.nmc-ctp.width",
                connection_name: "$topology.aToZ.resource.connection-name"
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
                            $concat: [
                                "$$value",
                                {
                                    $ifNull: ["$$this", ""]
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: {
                common_id: 1,
                id: 1,
                device_node_id: 1,
                hop_type: 1,
                resource_interface_name: 1,
                resource_type: 1,
                resourcetype: 1,
                circuit_pack_name: 1,
                port_name: 1,
                service_name: 1,
                nmc_ctp_frequency: 1,
                nmc_ctp_width: 1,
                connection_name: 1,
                etl_hash_id: {
                    $toHashedIndexKey: "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString() + " Number of records in temp_services_a_2_z_topology_view:", db.temp_services_a_2_z_topology_view.countDocuments());

// temp_services_z_2_a_topology_view
db.temp_services_z_2_a_topology_view.drop();
db.createView(
    "temp_services_z_2_a_topology_view", // name of view
    "temp_services", // Source collection
    [
        {
            $project: {
                _id: 0,
                common_id: "$common-id",
                topology: "$topology"
            }
        },
        {
            $unwind: {
                path: "$topology.zToA",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                common_id: 1,
                id: "$topology.zToA.id",
                device_node_id: "$topology.zToA.device.node-id",
                hop_type: "$topology.zToA.hop-type",
                resource_interface_name: "$topology.zToA.resource.interface-name",
                resource_type: "$topology.zToA.resource.type",
                resourcetype: "$topology.zToA.resourceType.type",
                circuit_pack_name: "$topology.zToA.resource.port.circuit-pack-name",
                port_name: "$topology.zToA.resource.port.port-name",
                service_name: "$topology.zToA.resource.service-name",
                nmc_ctp_frequency: "$topology.zToA.resource.nmc-ctp.frequency",
                nmc_ctp_width: "$topology.zToA.resource.nmc-ctp.width",
                connection_name: "$topology.zToA.resource.connection-name"
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
                            $concat: [
                                "$$value",
                                {
                                    $ifNull: ["$$this", ""]
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: {
                common_id: 1,
                id: 1,
                device_node_id: 1,
                hop_type: 1,
                resource_interface_name: 1,
                resource_type: 1,
                resourcetype: 1,
                circuit_pack_name: 1,
                port_name: 1,
                service_name: 1,
                nmc_ctp_frequency: 1,
                nmc_ctp_width: 1,
                connection_name: 1,
                etl_hash_id: {
                    $toHashedIndexKey: "$etl_hash_id_str"
                }
            }
        }
    ]
);
console.log(new Date().toISOString() + " Number of records in temp_services_z_2_a_topology_view:", db.temp_services_z_2_a_topology_view.countDocuments());