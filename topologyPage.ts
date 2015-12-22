import {Component, View,EventEmitter, OnInit,OnDestroy,OnChanges} from 'angular2/core';
import {DocumentConverter} from "./modules/DocumentConverter";
import {Models} from "./modules/Models";
import BaseEvent = d3.BaseEvent;

    @Component({
        selector: 'topology'
    })
    @View({
        templateUrl: '../pagehtmls/topology.html',
        directives: []
    })
    export class Topology implements OnInit,OnDestroy,OnChanges {

        private init:string;
        //svg
        private svg:any;
        private force:any;
        private svgLink:any;
        private svgNode:any;
        private div:any;
        private basisLineGen:any;
        private closedLinkGen:any;
        //line data
        private mLinkNum:any;
        private lTotalLinkNum:any;
        //data
        private currentJSON: any;
        private backup: any;
        public selectedCounter:number;

        //tabs
        private tabList: Array<Object>;
        private isSub:boolean;
        private currentClickedTabName :string;//this is used in when user closes a tab which its not the current tab, it does not refresh the page

        //tip
        public tip:any;
        public socket:any;
        constructor(){


            this.socket = io.connect();
            this.init = "Initializing";
            this.tabList = [{
                "name": "Total Network",
                "ip": "total",
                "status": "active-link"
            }];
        }
        ngOnChanges(e){
            console.log('something changed');
            console.log(e);
        }
        ngOnInit(){

            this.socket.on('topology', (data:Models.TopologyJSONData)=>{
                console.log('topology event triggered');
                if( !$.isEmptyObject(data) ){
                    console.log("topology, converting..");
                    var str = JSON.stringify(data.data.current[0]);
                    var newData = DocumentConverter.convert(str);
                    this.currentJSON = newData;
                    this.backup = newData;
                    this.tabList = [{
                        "name": "Total Network",
                        "ip": "total",
                        "status": "active-link"
                    }];
                    this.render(newData);
                }
            });



            $.ajax({url: "/getTopology",method:"GET"});

            console.log(this.init);

            //Window width and height
            var width = $(window).innerWidth();
            var height = $(window).innerHeight()-$('.navbar').innerHeight()-29-30-25;

            //Refresh button
            $(".topo-refresh-btn").on("click",()=>{
                console.log("refreshing");
                $.ajax({url: "/getTopology",method:"GET"});
            });

            //The SVG element
            this.svg = d3.select("#current-topology").append("svg")
                .attr("width", width)
                .attr("height", height)
                .append('g')
                .call(d3.behavior.zoom().on("zoom", this.redraw.bind(this))).on("dblclick.zoom", null)
                .append('g');

            //d3 tooltip
            this.tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([25, 0])
                .html(function(d:any) {
                    return "<strong>Flow Count:</strong> <span style='color:red'>" + d.colorCode + "</span>";
                });
            this.svg.call(this.tip);


            //zoom canvas(optional)
            this.svg.append("rect")
                .attr("class", "overlay")
                .attr("width", width)
                .attr("height", height)
                .style("fill","white");

            //force properties. It was -500
            this.force = d3.layout.force()
                .charge(-1000)
                .gravity(0.1)
                .linkDistance(function(d:any) {
                    if ((d.source.type === "Switch") && (d.target.type === "Host")) {
                        return 80;
                    }else{
                        return 120;
                    }
                })
                .size([width, height])
                .on("tick", this.tick.bind(this));

            this.basisLineGen = d3.svg.line()
                .interpolate("basis")//to change, def: basis, can be bundle
                .x(function(d:any) {return d.x;})
                .y(function(d:any) {return d.y;});

            this.closedLinkGen =  d3.svg.line()
                .x(function(d:any) {return d.x;})
                .y(function(d:any) {return d.y;})
                .interpolate("basis-closed");


            this.div = d3.select("body").append("div")
                                .attr("class", "topotooltip");

            this.selectedCounter = 0;
            d3.select(window).on("resize", this.resize.bind(this));

        }

        resize() {
            var width = window.innerWidth;
            var height = window.innerHeight;
            this.svg.attr("width", width).attr("height", height);
            this.force.size([width, height]).resume();
        }

        mouseover() {
            return this.div.style("opacity", 0.9);
        }

        //draw topology end
        render(graph){

            var curGraph = this.flatten(graph);

            $.each(curGraph.nodes,(i,n:any)=>{
               if(n.fixed) {
                   n.x=150;
                   n.y=150;
               }
            });
            //comes from flatten X and Y are randomized in force: x,y xy x y
            this.force.nodes(curGraph.nodes)
                    .links(curGraph.links)
                    .start();

            this.svgLink = this.svg.selectAll(".link").data(curGraph.links);


                //Things about links
            this.svgLink.select("path.path-link")
                .style("stroke-dasharray", function(d: Models.Links) {
                    //parçalı link için
                    if (d.blocked === 0) {
                        return "5,0";
                    } else if (d.blocked === 1) {
                        return "5,2";
                    } else {
                        return "5,0";
                    }})
                .style("stroke", function(d) {

                    if(d.colorCode == "A"){
                        d3.select(this).attr("class", "path-link A");
                    }else if(d.colorCode == "B"){

                        if(d.source.type == "Host" || d.target.type=="Host"){
                            return "blue";
                            //d3.select(this).attr("class", "path-link B");
                        }else{
                            d3.select(this).attr("class", "path-link B");
                        }
                    }else if(d.colorCode == "C"){
                        d3.select(this).attr("class", "path-link C");
                    }else if(d.colorCode == "D"){
                        d3.select(this).attr("class", "path-link D");
                    }else if(d.colorCode == "E"){
                        d3.select(this).attr("class", "path-link E");
                    }else{
                        return "white";
                    }
                })
                .style("stroke-width",(d)=>{return this.linkWidth(d);});



                var that = this;
                var linkEnter = this.svgLink.enter().append("g")
                                .attr("class", "link");


                linkEnter.append("path").attr("class", "path-link")
                    .attr("id", function(d){
                        return "link" + d.linkId;
                     })
                    .on('mouseover', that.tip.show)
                    .on('mouseout', that.tip.hide)
                    .style("stroke-dasharray", function(d) {
                        if (d.blocked === 0) {
                            return "5,0";
                        } else if (d.blocked === 1) {
                            return "5,2";
                        } else {
                            return "5,0";
                        }
                    })
                    .style("stroke", function(d) {
                        if (d.source.type === "Switch" && d.target.type === "Switch") {
                            return that.strokeColor(d);//"#7BB7EF";//that.strokeColor(d);
                        } else if ((d.source.type === "Internet") || (d.target.type === "Internet")) {
                            return that.strokeColor(d);
                        } else {
                            //return "#3182bd";
                            if(d.colorCode == "A"){
                                d3.select(this).attr("class", "path-link A");
                            }else if(d.colorCode == "B"){
                                return 'blue';
                                //d3.select(this).attr("class", "path-link B");
                            }else if(d.colorCode == "C"){
                                d3.select(this).attr("class", "path-link C");
                            }else if(d.colorCode == "D"){
                                d3.select(this).attr("class", "path-link D");
                            }else if(d.colorCode == "E"){
                                d3.select(this).attr("class", "path-link E");
                            }else{
                                return "white";
                            }
                        }
                    })
                    .style("stroke-width", (d)=>{return this.linkWidth(d)});

                linkEnter.append("text")
                    .attr("class", "port-source")
                    .attr("font-size", function(d) {
                        if ((d.source.type === "Switch") && (d.target.type === "Switch")) {
                            return "14px";
                        } else if (d.source.type === "Internet" || d.target.type === "Internet") {
                            return "14px";
                        } else {
                            return "12px";
                        }
                    })
                    .attr("dy", "0.4em")
                    .attr("text-anchor", "middle")
                    .attr("stroke", function(d) {
                        if ((d.source.type === "Switch") && (d.target.type === "Switch")) {
                            return "#00008B";
                        } else if ((d.source.type === "Internet") || (d.target.type === "Internet")) {
                            return "#D56A6A";
                        } else {
                            return "#263C77";
                        }
                    })
                    .append("textPath").attr("class","text-path")
                    .attr("startOffset","75%")
                    .attr("xlink:href",function(d:Models.Links,i) {
                        return "#link" + d.linkId;
                    }).text(function(d: Models.Links) {
                    if(d.source.ipv4Address=="192.196.197.aydinabi"){console.log(d);}
                    if ((d.source.type === "Switch") && (d.target.type === "Switch")) {
                        return d.srcPortId;
                    } else if (d.source.type === "Internet" || d.target.type === "Internet") {
                        return d.srcPortId;
                    } else {
                        return d.source.switchPortNo;
                    }
                });

                linkEnter.append("text")
                    .attr("class", "port-target")
                    .attr("font-size", function(d) {
                        if ((d.source.type === "Switch") && (d.target.type === "Switch")) {
                            return "14px";
                        } else if (d.source.type === "Internet" || d.target.type === "Internet") {
                            return "14px";
                        } else {
                            return "12px";
                        }})
                    .attr("dy","0.4em")
                    .attr("text-anchor", "middle")
                    .attr("stroke", function(d) {
                        if ((d.source.type === "Switch") && (d.target.type === "Switch")) {
                            return "#00008B";
                        } else if (d.source.type === "Internet" || d.target.type === "Internet") {
                            return "#D56A6A";
                        } else {
                            return "#263C77";
                        }
                    })
                    .append("textPath").attr("class","text-path")
                    .attr("startOffset","25%")
                    .attr("xlink:href",function(d:Models.Links,i) {
                        return "#link" + d.linkId;
                    }).text(function(d: Models.Links) {
                    if ((d.source.type === "Switch") && (d.target.type === "Switch")) {
                        return d.destPortId;
                    } else if (d.source.type === "Internet" || d.target.type === "Internet") {
                        return d.srcPortId;
                    } else {
                        return d.target.switchPortNo;
                    }
                });

            this.svgLink.exit().remove();
                //----------------------------LINKS END---------------------------------------//
                //---------------------------NODES START--------------------------------------//


            this.svgNode = this.svg.selectAll("g.node").data(curGraph.nodes);
                //select circles inside g.node
            this.svgNode.select("circle")
                    .attr("r", function(d:Models.Nodes):string|number {
                        var $p = $("<p class='E'></p>").hide().appendTo("body");
                        var radiusE = $p.css("width");
                        $p.remove();

                        if(d.colorCode === "E"){
                            return radiusE;
                        }else if (d.type === "Internet") {
                            return "images/internet_cloud.png";
                        } else if (d.type === "Switch") {
                            return 20;
                        }else{
                            return 4.5;
                        }


                    })
                    .style("stroke", that.strokeColor)
                    .style("stroke-width", that.strokeWidth);

                //select images inside g.node
            this.svgNode
                    .on("mouseover", that.mouseover.bind(that))
                    .on("mousemove", that.mousemove.bind(that))
                    .on("mouseout", that.mouseout.bind(that));
                //select texts inside g.node
            this.svgNode.select("text").attr("text-anchor", "middle")
                .attr("dy", function(d:Models.Nodes){
                    if(d.type=="Switch"){
                        return "0.2em";
                    }else{
                        return "-0.6em";
                    }
                })
                .text(function(d:Models.Nodes) {
                    var splitIP;
                    if (d.vendor === "LEGACY" && d.type !== "Internet") {
                        return d.name;
                    } else {
                        if (d.type === "Switch") {
                            splitIP = d.ipv4Address.split(".");
                            return splitIP[3];
                        } else if (d.type === "Host") {
                            splitIP = d.hostIpv4Address.split(".");
                            return splitIP[2] + "." + splitIP[3];
                        }
                    }
                });

                //now append the selected ones above
                var nodeEnter = this.svgNode.enter().append("g")
                    .attr("class", "node")
                    .on("contextmenu",function(d,i){
                        var dataset = [{
                            title: 'Remove Node',
                            action: ""
                        }];

                        that.setContextMenu(that,dataset,d,i,this);
                    })
                    .on("click", function(d){
                                       if (d3.event.defaultPrevented) return; // ignore drag
                                    if(d.type === "Host"){
                                           if ( !d3.select(this).classed("selected") && that.selectedCounter<2) {
                                               d3.select(this).classed("selected",true).select("circle").transition().duration(750).attr("r","10");
                                               that.selectedCounter++;
                                               console.log(that.selectedCounter + " host(s) chosen.");
                                           } else if (d3.select(this).classed("selected")){
                                               d3.select(this).classed("selected",false).select("circle").transition().duration(750).attr("r","4.5");
                                               that.selectedCounter--;
                                           } else if (!d3.select(this).classed("selected") && that.selectedCounter==2){
                                               bootbox.alert("Please de-select one of the hosts in order to choose another one. Maximum selected host number must be 2");
                                           }
                                       }
                                       if (!((d.type === "Host") || (d.type === "Internet"))) {
                                           if (d.children) {
                                               d._children = d.children;
                                               d.children = null;
                                           } else {
                                               d.children = d._children;
                                               d._children = null;
                                           }
                                           return that.render(that.currentJSON);
                                       }
                    })
                    .call(that.force.drag()
                                           .on("dragstart", function() {
                                               var event:BaseEvent = d3.event;
                                               return event.sourceEvent.stopPropagation();
                                            })
                                           .on("drag", function(d) {
                                               return d3.select(this).classed("fixed", d.fixed = true);
                                            })
                     )
                     .on("dblclick",function(d) {
                         d3.select(this).classed("fixed", d.fixed = false);
                     });

                nodeEnter.append("circle")
                    .attr("r", function(d):string|number {
                        if (d.type === "Internet") {
                            return "images/internet_cloud.png";
                        } else if (d.type === "Switch") {
                            return 20;
                        }else{
                            return Math.sqrt(d.size) / 10 || 4.5;
                        }
                    })
                    .style("stroke", that.strokeColor)
                    .style("stroke-width", 2)
                    .style("fill", that.color);

                nodeEnter.append("text")
                    .attr("text-anchor", "middle")
                    .attr("dy", (d:Models.Nodes)=>{
                        if(d.type=="Switch"){
                            return "-0.0em";
                        }else{
                            return "-0.6em";
                        }
                    })
                    .text(function(d) {
                        var splitIP;
                        if (d.vendor === "LEGACY" && d.type !== "Internet") {
                            return d.name;
                        } else {
                            if (d.type === "Switch") {
                                splitIP = d.ipv4Address.split(".");
                                return splitIP[3];
                            } else if (d.type === "Host") {
                                splitIP = d.hostIpv4Address.split(".");
                                return splitIP[2] + "." + splitIP[3];
                            }
                        }
                    });

                nodeEnter
                    .on("mouseover", that.mouseover.bind(that))
                    .on("mousemove", that.mousemove.bind(that))
                    .on("mouseout", that.mouseout.bind(that));
            this.svgNode.exit().remove();
                //--------------------------NODES END-------------------------------//


                //--------------------------TICK-----------------------------------//
        }

        tabClicked(tabs){
                this.currentClickedTabName = tabs.name;

                var ind;
                var ips = [];
                tabs.status = "active-link";
                $.each(this.tabList, function(i,tab:any) {
                    if (tab.ip !== tabs.ip) {
                        tab.status = "";
                    }
                });
                if (tabs.ip !== "total") {
                        $.each(this.backup.nodes,function(k,v){
                            ips.push(v.ipv4Address);
                        });
                    ind = ips.indexOf(tabs.ip);
                    this.isSub = true;
                    this.currentJSON = {
                        links: [],
                        "nodes": [this.backup.nodes[ind]]
                    };
                } else {
                    this.isSub = false;
                    this.currentJSON = this.backup;
                }
            this.render(this.currentJSON);
        }

        newTab(elm, node, i){
                this.currentClickedTabName = node.name;
                var ind, indexOfNode, ips, tempNode;
                ips=[];
                $.each(this.tabList,function(k,v:any){
                    ips.push(v.ip);
                });
                indexOfNode = ips.indexOf(node.ipv4Address);
console.log("index of tab");
console.log(indexOfNode);
                if (indexOfNode === -1) {
                    $.each(this.tabList, function(tab :any) {
                        return tab.status = "";
                    });
                    this.tabList.push({
                        "name": node.name,
                        "ip": node.ipv4Address,
                        "status": "active-link"
                    });
                    ips=[];
                    $.each(this.backup.nodes,function(k,v){
                        ips.push(v.ipv4Address);
                    });
                    ind = ips.indexOf(node.ipv4Address);
                    tempNode = this.backup.nodes[ind];
                    this.isSub = true;
                    this.currentJSON = {
                        links: [],
                        "nodes": [tempNode]
                    };
                } else {
                     /*$.each(this.tabList, function(tab) {
                         if (tab.ip === node.ipv4Address) {
                             tab.status = "active-link";
                             ips = _.pluck($scope.backup.nodes, "ipv4Address");
                             ind = _.indexOf(ips, node.ipv4Address);
                             this.
                             tempNode = $scope.backup.nodes[ind];
                             $scope.isSub = true;
                             return $scope.topologyData = {
                                     links: [],
                                     "nodes": [tempNode]
                                    };
                         } else {
                             return tab.status = "";
                         }
                     });*/
                }
                this.render(this.currentJSON);

        }

        tabClosed(tabs){
            var indexOfNode;
            var ips = [];
            $.each(this.tabList,function(k,v:any){
                ips.push(v.ip);
            });
            indexOfNode = ips.indexOf(tabs.ip);
            //if not first which is total
            if (indexOfNode !== 0) {
                this.tabList.splice(indexOfNode, 1);
                this.isSub = false;
                this.currentJSON = this.backup;
            }
            //if tab closed is the current tab then render
            if(this.currentClickedTabName == tabs.name){
                this.render(this.currentJSON);
            }

        }
        tick(e) {

            var that = this;
            var k;

            k = 2 * e.alpha;
            //this.svgNode.each(function(d) {
            //    if (d.type !== "Host") {
            //        return d.y += (d.group * 100 - d.y) * k;
            //    }
            //});

            this.svgLink.selectAll("path.path-link")
                .attr("d", function(d:Models.Links) {

                    if (!d.selfLink) {

                        var dx = d.target.x - d.source.x,
                            dy = d.target.y - d.source.y,
                            dr = Math.sqrt(dx * dx + dy * dy),
                            largeArcFlag=0,
                            sweepFlag=1;

                        if(d.order == 1){
                            dr = 0;
                        }else if(d.order > 1){
                            // if there are multiple links between these two nodes, we need generate different dr for each path as dr gets bigger arc gets smaller
                            dr = dr/(1 + (1/d.source.weight) * (d.order - 1));
                            //on even and odd numbers change the sweep flag so arc would have a positive and negative curve respectively
                            if(d.order % 2 == 0){
                                sweepFlag=1;
                            }else if(d.order % 2 == 1){
                                sweepFlag=0;
                            }

                        }

                        return "M" + d.source.x + "," + d.source.y +
                            "A" + dr + "," + dr + " 0 "+ largeArcFlag +" " + sweepFlag + "," + d.target.x + "," + d.target.y;
                            //+"A" + dr + "," + dr + " 0 "+ largeArcFlag +" 0," + d.source.x + "," + d.source.y;

                    } else {
                        return that.closedLinkGen(that.closedLinkArc(d));
                    }});

                this.svgNode.attr("transform", that.transform);
    }

        transform(d) {
            return "translate(" + d.x + "," + d.y + ")";
        }


        setContextMenu(that, dataset,d,data3,data1){
            var mode,contextDiv;
            d3.selectAll('#contextmenu-node').data(dataset)
                .enter()
                .append('ul')
                .attr('id', 'contextmenu-node');

            d3.event.preventDefault();
            mode = null;
            if(d.required)
                mode = "Unrequired";
            else
                mode = "Required";

            if(d.type == "Switch"){

                  //  d3.selectAll("#contextmenu-node").html('');
                    d3.select("#contextmenu-node")
                                .selectAll('li').data(dataset).enter()
                                .append('li');

                    var event:BaseEvent = d3.event;
                    // display context menu
                    d3.select('#contextmenu-node')
                        .style('left', (event.pageX - 2) + 'px')
                        .style('top', (event.pageY -2) + 'px')
                        .style('display', 'block')
                        .html(function(i,d){
                            return "<li class='contextmenu-item'> New Tab </li>";
                        })
                        .on("click",(data,i)=>{
                            this.newTab(data1, d, data3);
                            d3.select('#contextmenu-node').style('display', 'none');
                        })
                        .on("mouseleave", ()=>{
                            d3.select('#contextmenu-node').remove();
                            contextDiv = null;
                            mode = null;
                            }
                        );

                    d3.event.preventDefault();
            }

        }

        color(d) {
            // inside color
            if (d.type === "Host") {return "#c6dbef";}
            else if (d.type === "Internet") {return "#fd8d3c";}
            else if (d.type === "Switch") {
                if (d._children) {
                    return "#7BB7EF";//"#FF4000";
                }
                if (d.children) {
                    return "#7BB7EF";//"#fd8d3c";
                }
            }
            return "#d6dbef";
        }
        //circle periphery thickness
        strokeWidth(d){
            var $p = $("<p class='E'></p>").hide().appendTo("body");
            var widthE = $p.css("stroke-width");
            $p.remove();
            if(d.colorCode==="E"){
                return widthE;
            }else{
                return "2";
            }
        }

        linkWidth(d){
            if (d.source.type === "Switch" && d.target.type === "Switch") {
                switch(d.linkWeight){
                    case "A":
                        return "20";
                        break;
                    case "B":
                        return "9";
                        break;
                    case "C":
                        return "5";
                        break;
                    case "D":
                        return "2";
                        break;
                    case "E":
                        return "1";
                        break;
                    default:
                        return "black";
                        break;}
            }else{
                return "2";
            }
        }
        strokeColor(d) {
            // injects an invisible <p> element with
            // a css class which will be used for
            // stroke color
            //--------this is only for CSS
            var $p = $("<p class='A'></p>").hide().appendTo("body");
            var colorA = $p.css("stroke");
            $p.remove();
            var $p = $("<p class='B'></p>").hide().appendTo("body");
            var colorB = $p.css("stroke");
            $p.remove();
            var $p = $("<p class='C'></p>").hide().appendTo("body");
            var colorC = $p.css("stroke");
            $p.remove();
            var $p = $("<p class='D'></p>").hide().appendTo("body");
            var colorD = $p.css("stroke");
            $p.remove();
            var $p = $("<p class='E'></p>").hide().appendTo("body");
            var colorE = $p.css("stroke");
            $p.remove();

            // periphery
            if (d.status === 0) {
                switch (d.colorCode) {
                    case "A":
                        // There are circles inside
                        // switch svgs so this won't
                        // work properly. If you click
                        // on the svg it works some..
                        // d3.select(this).attr("class","A");
                        //--------ONLY for CSS
                        return colorA;
                        break;
                    case "B":
                        if(d.type == "Switch" || d.type == "Host"){
                            return "blue";
                        }else{
                            return colorB;
                        }
                        break;
                    case "C":
                        return colorC;
                        break;
                    case "D":
                        return colorD;
                        break;
                    case "E":
                        return colorE;
                        break;
                    default:
                        return "black";
                        break;}
            } else if (d.status === 1) {
                return "green";
            } else if (d.status === 2) {
                return "red";
            } else if (d.status === 3) {
                return "#926E02";
            } else {
                return "black";
            }
        }




        closedLinkArc(d) {
            var lineData, r;
            lineData = [];
            if (d.order === 1) {
                r = 30;
                lineData.push({
                    "x": d.source.x,
                    "y": d.source.y
                });
                lineData.push({
                    "x": d.source.x - r,
                    "y": d.source.y + r
                });
                lineData.push({
                    "x": d.source.x - 2 * r,
                    "y": d.source.y
                });
                lineData.push({
                    "x": d.source.x - r,
                    "y": d.source.y - r
                });
                lineData.push({
                    "x": d.source.x,
                    "y": d.source.y
                });
            }
            return lineData;
        }


        redraw(){
            var event:BaseEvent = d3.event;
            return this.svg.attr("transform", "translate(" + event.translate + ")" + " scale(" + event.scale + ")");
        }

        mousemove(d:any) {
            if (d.type === "Switch") {

                var over_links = this.svg.selectAll('.link').filter(function(link) {
                    return link.source.hwAddress !== d.hwAddress && link.target.hwAddress !== d.hwAddress
                });
                over_links.classed('blurred',true);

                return this.div.html("<span class=tool-head>Switch Info   </span>" + "<span class=tool-info-head>IP:</span>" + d.ipv4Address + " " + "<span class=tool-info-head>MAC:</span>" + d.hwAddress + " " + "<span class=tool-info-head>Vendor:</span> " + d.vendor + " " + "<span class=tool-info-head>Active Since:</span> " + d.activeSince + " " + "<span class=tool-info-head>Data Path Id:</span> " + d.dataPathId + " " + "<span class=tool-info-head>Version:</span>" + d.version + " " + "<span class=tool-info-head>Status:</span>" + d.status + " " + "<span class=tool-info-head>Required:</span> " + d.required + " ");
            } else if (d.type === "Host") {
                return this.div.html("<span class=tool-head>HOST Info   </span>" + "<span class=tool-info-head>Display Name:</span>" + d.username + " " + "<span class=tool-info-head>IP:</span>" + d.hostIpv4Address + " " + "<span class=tool-info-head>MAC:</span>" + d.hostHWAddress + " " + "<span class=tool-info-head>Switch HW:</span>" + d.switchHWAddress + " " + "<span class=tool-info-head>Switch PORT:</span>" + d.switchPortNo + " " + "<span class=tool-info-head>Active Since:</span> " + d.activeSince + " " + "<span class=tool-info-head>Status:</span>" + d.status + " " + "<span class=tool-info-head>Required:</span> " + d.required + " ");
            }
        }

        mouseout() {
            this.svg.selectAll('.link').classed('blurred', false);
            return this.div.html("");
        }


        flatten(root:any){

            var getIndex, i, links, nodes, recurse;

            getIndex = function(nodeList, node) {
                var i, j, n, result;
                result = -1;
                for (i = j = 0; j < nodeList.length; i = ++j) {
                    n = nodeList[i];
                    if (n.name === node.name) {
                        result = i;
                        break;
                    }
                }
                return result;
            };
            nodes = [];
            links = [];
            i = 0;

            recurse = function(n) {
                if (n.children) {
                    n.children.forEach(recurse);
                }
                if (!n.id) {
                    n.id = ++i;
                }
                if (n.type === "Host") {
                    return nodes.push(n);
                }
            };

            $.each(root.nodes, function(index,val) {
                if (val.type !== "Host") {
                    return nodes.push(val);
                }
            });

            $.each(root.nodes, function(index,val) {
                return recurse(val);
            });
            // link colorCodess
            $.each(root.links, function(index,l) {
                return links.push({
                    "source": l.source,
                    "target": l.target,
                    "srcHWAddress": l.srcHWAddress,
                    "srcPortId": l.srcPortId,
                    "destHWAddress": l.destHWAddress,
                    "destPortId": l.destPortId,
                    "blocked": l.blocked,
                    "status": l.status,
                    "type": l.type,
                    "order": l.order,
                    "selfLink": l.selfLink,
                    "colorCode": l.colorCode,
                    "customData": l.customData,
                    "linkWeight": l.linkWeight,
                    "linkId": index + 1
                });
            });
            // Links are pushed here (Internet index
            // occured here)
            $.each(links, function(index, aLink) {
                var ind, j, m, ref, ref1, results;
                for (ind = j = 0, ref = nodes.length - 1; 0 <= ref ? j <= ref : j >= ref; ind = 0 <= ref ? ++j : --j) {
                    if (nodes[ind].name === root.nodes[aLink.source].name) {
                        links[index].source = ind;
                        break;
                    }
                }
                results = [];
                for (ind = m = 0, ref1 = nodes.length - 1; 0 <= ref1 ? m <= ref1 : m >= ref1; ind = 0 <= ref1 ? ++m : --m) {
                    if (nodes[ind].name === root.nodes[aLink.target].name) {
                        links[index].target = ind;
                        break;
                    } else {
                        results.push(void 0);
                    }
                }
                return results;
            });

            $.each(root.nodes, function(index, node) {
                if (node.children) {
                    return node.children.forEach(function(child:any) {
                        return links.push({
                            "source": getIndex(nodes, node),
                            "target": getIndex(nodes, child),
                            "order": 1,
                            "colorCode": child.colorCode
                        });
                    });
                }
            });
            return {
                nodes: nodes,
                links: links
            };
        }

        ngOnDestroy(){
            //binds
            d3.select('svg').remove();
            d3.select('.d3-tip').remove();
            d3.select('.topotooltip').remove();
            d3.select('#sliderHolder').remove();
        }
    }