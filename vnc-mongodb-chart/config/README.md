# Creating the VNC data flattened views #

Based on the imported collections in MongoDB, we run view-creation scripts that flatten the data so it can be exported to CSV.

## Processing ##

Use the MongoDB command-line tool `mongosh` to run each script. Each script uses `db.createView()` to create views from the loaded collections.

_We assume the MongoDB database is named `dap`._

<u>**Devices**</u>

mongosh dap devices.js

This creates:
* devices_joined_rdm_view
* devices_base_rdm_view
* devices_circuit_packs_rdm_view
* devices_circuit_packs_cp_rdm_view
* devices_physical_link_rdm_view
* devices_port_parents_rdm_view
* devices_interfaces_rdm_view
* devices_interfaces_oms_rdm_view
* devices_interfaces_ots_rdm_view
* devices_shelf_rdm_view
* devices_srg_rdm_view
* devices_shelf_xpdr_view
* devices_degree_rdm_view
* devices_base_xpdr_view
* devices_circuit_packs_xpdr_view
* devices7_base_xpdr_view
* devices7_shelf_xpdr_view
* devices7_circuit_pack_xpdr_view

<u>**Fiber Cables**</u>

mongosh dap fiber_cables.js

This creates:
* fiber_cables_base_view

<u>**Fiber Tails**</u>

mongosh dap fiber_tails.js

This creates:
* fiber_tails_view

<u>**IOFL**</u>

mongosh dap iofl.js

This creates:
* iofl_client_view
* iofl_network_view

<u>**NetworksV7**</u>

mongosh dap networks_v7.js

This creates:
* networks_v7_openroadm_network_view
* networks_v7_openroadm_topology_view
* networks_v7_openroadm_otn_topology_view
* networks_v7_ietf_network_topology_view

<u>**Operational Networks DS**</u>

mongosh dap OperationalNetworksDS.js

This creates:
* OperationalNetworksDS_link_view

<u>**Services**</u>

mongosh dap services.js

This creates:
* services_base_view
* services_a_2_z_topology_view
* services_a_2_z_network_topology_view
* services_z_2_a_topology_view
* services_z_2_a_network_topology_view

<u>**Temp Services (optional)**</u>

mongosh dap temp_services.js

This creates:
* temp_services_base_view
* temp_services_a_2_z_topology_view
* temp_services_z_2_a_topology_view
