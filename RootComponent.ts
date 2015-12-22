import {bootstrap}    from 'angular2/platform/browser';
import {Component, provide,View,OnInit,Inject} from 'angular2/core';
import {RouteConfig,  ROUTER_DIRECTIVES, ROUTER_PROVIDERS} from 'angular2/router';
import {Topology} from "./topologyPage";
import {Test} from "./Test";

// Root Component
@Component({
    selector: 'RootComponent'
})
@View({
    templateUrl: 'navigation/topnav.html',
    directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([
    {path: '/test', component: Test, name: 'Test'},
    {path: '/...', name: 'T', redirectTo: ['Topology']},
    {path: '/topology', name: 'Topology', component: Topology, useAsDefault: true}
])
export class RootComponent implements OnInit {
    constructor(){

    }
    ngOnInit(){
        $(".nav a").on("click", function(){
            $(".nav").find(".active").removeClass("active");
            $(this).parent().addClass("active");
        });
        var pathname = window.location.pathname;
        console.log(pathname);
    }
}


bootstrap(RootComponent, [ROUTER_PROVIDERS]);
