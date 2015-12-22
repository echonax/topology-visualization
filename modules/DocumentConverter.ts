/**
 * Created by ekinca on 18.11.2015.
 */
export class DocumentConverter{
//We use this class to convert the data into D3 data
    public topologyData:string;
    public d3TopologyJSONe;
    public topology;

    constructor(data:any){
        console.log("Document Converter Constructor");
        console.log(data);
    }

    static convert(data){
        var topology:Models.TopologyDataCurrentArrayObject = JSON.parse(data);
        var d3TopologyJSON = {
            "nodes": [],
            "links": []
        };

        if ( (topology != null) && (topology.Switches != null) ) {
            var legacyCount = 1;
            $.each(topology.Switches, function(i, sw:Models.SwitchObject) {
                //SWITCH VENDOR ISNT LEGACY
                if (sw.vendor !== "LEGACY") {
                    //"color": "yellow", u can call this from d3Directives
                    return d3TopologyJSON.nodes.push({
                        "type": "Switch",
                        "name": "Switch" + (i + 1),
                        "dataPathId": sw.dataPathId,
                        "hwAddress": sw.hwAddress,
                        "ipv4Address": sw.ipv4Address,
                        "vendor": sw.vendor,
                        "activeSince": sw.activeSince,
                        "packets": sw.packets,
                        "bytes": sw.bytes,
                        "flows": sw.flows,
                        "version": sw.version,
                        "status": sw.status,
                        "required": sw.required,
                        "group": sw.depth + 1,
                        "_children": [],
                        "children": [],
                        "colorCode": sw.colorCode,
                        "fixed":sw.fixed
                    });
                    //SWITCH DATAPATHID IS INTERNET
                } else {
                    if (sw.dataPathId.toUpperCase() === "INTERNET") {
                        return d3TopologyJSON.nodes.push({
                            "type": "Internet",
                            "name": "Internet" + (i + 1),
                            "dataPathId": sw.dataPathId,
                            "hwAddress": sw.hwAddress,
                            "ipv4Address": sw.ipv4Address,
                            "vendor": sw.vendor,
                            "activeSince": sw.activeSince,
                            "packets": sw.packets,
                            "bytes": sw.bytes,
                            "flows": sw.flows,
                            "version": sw.version,
                            "status": sw.status,
                            "required": sw.required,
                            "group": 0.3,
                            "_children": [],
                            "children": []
                        });
                    } else {
                        //SWITCH IS LEGACY
                        d3TopologyJSON.nodes.push({
                            "type": "Switch",
                            "name": "Legacy" + legacyCount,
                            "dataPathId": sw.dataPathId,
                            "hwAddress": sw.hwAddress,
                            "ipv4Address": sw.ipv4Address,
                            "vendor": sw.vendor,
                            "activeSince": sw.activeSince,
                            "packets": sw.packets,
                            "bytes": sw.bytes,
                            "flows": sw.flows,
                            "version": sw.version,
                            "status": sw.status,
                            "required": sw.required,
                            "group": sw.depth + 1,
                            "_children": [],
                            "children": []
                        });
                        return legacyCount++;
                    }
                }
            });
            //takes hwAddress name of every nodes
            var hwAddresses = [];
            $.each(d3TopologyJSON.nodes,function(k,v:Models.Nodes){
                hwAddresses.push(v.hwAddress);
            });

            $.each(topology.Hosts, function(i, host:Models.HostObject) {
                var indexOfSwitchNode;
                indexOfSwitchNode = hwAddresses.indexOf( host.switchHWAddress );
                d3TopologyJSON.nodes[indexOfSwitchNode].children.push({
                    "type": "Host",
                    "name": "Host" + (i + 1),
                    "hostHWAddress": host.hostHWAddress,
                    "hostIpv4Address": host.hostIpv4Address,
                    "switchHWAddress": host.switchHWAddress,
                    "switchPortNo": host.switchPortNo,
                    "activeSince": host.activeSince,
                    "username": host.username,
                    "required": host.required,
                    "status": host.status,
                    "group": host.depth + 1,
                    "colorCode": host.colorCode
                });
            });
        }
        if (topology && (topology.Links != null)) {
            $.each(topology.Links, function(i,link:Models.LinksObject) {
                var cnt, ref, sourceIndex, targetIndex;
                sourceIndex = hwAddresses.indexOf( link.srcHWAddress);
                targetIndex = hwAddresses.indexOf( link.destHWAddress);

                cnt = 1;
                ref = d3TopologyJSON.links;
                for (var j = 0; j < ref.length; j++) {
                    if ((ref[j].source === sourceIndex) && (ref[j].target === targetIndex)) {
                        cnt++;
                    }
                }
                link["order"] = cnt;
                //how many links between source-target
                return d3TopologyJSON.links.push({
                    "type": "Link",
                    "source": sourceIndex,
                    "target": targetIndex,
                    "destPortId": link.destPortId,
                    "srcPortId": link.srcPortId,
                    "blocked": link.blocked,
                    "required": link.required,
                    "status": link.status,
                    "order": link.order,
                    "colorCode": link.colorCode,
                    "linkWeight": link.linkWeight
                });
            });
            var ref = d3TopologyJSON.links;
            for (var j = 0; j < ref.length; j++) {
                if (ref[j].source === ref[j].target) {
                    ref[j]["selfLink"] = true;
                } else {
                    ref[j]["selfLink"] = false;
                }
            }
        }
        return d3TopologyJSON;
    }

}