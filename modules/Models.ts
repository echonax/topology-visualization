module Models{

    export class Nodes {
        type: string;
        name: string;
        dataPathId: string;
        hwAddress: string;
        ipv4Address: string;
        hostIpv4Address: string;
        vendor: string;
        activeSince: string;
        packets: string;
        bytes: string;
        flows: string;
        version: string;
        status: string;
        required: string;
        group: number;
        _children: Array<any>;
        children: Array<any>;
        colorCode: string;


       }

    export interface Links {
        source?: any;
        target?: any;
        srcHWAddress?: any;
        srcPortId?: any;
        destHWAddress?: any;
        destPortId?: any;
        value?: any;
        blocked?: any;
        status?: any;
        type?: any;
        order?: any;
        selfLink?: any;
        colorCode?: any;
        customData?: any;
        linkId?: number;
        linkWeight?: any;

       }

    export interface TopologyJSONData {
        data:TopologyJSONDataObject;

    }
    export interface TopologyJSONDataObject {
        current:Array<TopologyDataCurrentArrayObject>;
        track:JSON;
    }
    export interface TopologyDataCurrentArrayObject {
        Hosts:Array<HostObject>;
        Info:InfoObject;
        Links:Array<LinksObject>;
        Switches:Array<SwitchObject>;
    }
    export interface HostObject {
        activeSince:string;
        colorCode:string;
        depth:number;
        displayName:string;
        hostHWAddress:string;
        hostIpv4Address:string;
        required:boolean;
        status:number;
        switchHWAddress:string;
        switchPortNo:string;
        username?:string;
    }

    export interface InfoObject {
        activeSince:string;
        elementCountPerDepth?: Array<number>;
        maxDepth:number;
        name:string;
        weight:number;
    }

    export interface LinksObject {
        blocked:number;
        colorCode:string;
        destHWAddress:string;
        destPortId:number;
        required:boolean;
        srcHWAddress:string;
        srcPortId:number;
        status:number;
        order?:string;
        linkWeight?: any;
    }

    export interface SwitchObject {
        activeSince:string;
        blocked:number;
        bytes:number;
        colorCode:string;
        dataPathId:string;
        depth:number;
        flows:number;
        hwAddress:string;
        ipv4Address:string;
        packets:number;
        required:boolean;
        status:number;
        vendor:string;
        version:string;
        fixed?:boolean;
    }
}