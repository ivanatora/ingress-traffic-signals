// ==UserScript==
// @id             iitc-plugin-traffic-lights@ivanatora
// @name           IITC plugin: show traffic lights
// @category       Info
// @version        0.1.0.20170804.120311
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [local-2017-08-04-120311] Show some really bad places for a portal that can be hacked from a car waiting on a red light
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// @require         https://rawgit.com/mapbox/leaflet-geodesy/gh-pages/leaflet-geodesy.js
// @require         https://api.mapbox.com/mapbox.js/plugins/turf/v2.0.2/turf.min.js
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
    if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
    plugin_info.buildName = 'local';
    plugin_info.dateTimeVersion = '20170804.120311';
    plugin_info.pluginId = 'traffic-lights-plugin';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
    window.plugin.trafficLights = function() {

    }

    window.plugin.trafficLights.searchTraffic = function() {
        if(plugin.trafficLights.isQueryRunning) return;

        plugin.trafficLights.isQueryRunning = true;

        $.ajax({
            url        : 'https://overpass-api.de/api/interpreter?data=' +
            '[out:json][timeout:25];' +
            '(node["highway"="traffic_signals"](' + window.plugin.trafficLights.getBbox() + '););' +
            'out body;' +
            '>;' +
            'out skel qt;',
            dataType   : 'json',
            crossDomain: true,
            success    : function(res) {
                if(plugin.trafficLights.circleUnion) {
                    map.removeLayer(plugin.trafficLights.circleUnion);
                }

                plugin.trafficLights.isQueryRunning = false;
                for(var i in res.elements) {
                    var center = L.latLng(res.elements[ i ].lat, res.elements[ i ].lon);

                    var circ = LGeo.circle(center, 180, { color: 'red' }).addTo(plugin.trafficLights.circleLayer);
                }

                plugin.trafficLights.circleUnion = window.plugin.trafficLights.unify(plugin.trafficLights.circleLayer.getLayers()).addTo(map);
            }
        })
    }

    window.plugin.trafficLights.getBbox = function() {
        var bbox = map.getBounds();
        var a = bbox._southWest,
            b = bbox._northEast;
        return [ a.lat, a.lng, b.lat, b.lng ].join(",");
    }

//union function using turf.js
    window.plugin.trafficLights.unify = function(polyList) {
        for(var i = 0; i < polyList.length; ++i) {
            if(i == 0) {
                var unionTemp = polyList[ i ].toGeoJSON();
            } else {
                unionTemp = turf.union(unionTemp, polyList[ i ].toGeoJSON());
            }
        }
        return L.geoJson(unionTemp, { style: plugin.trafficLights.unionStyle });
    }

    var setup = function() {
        plugin.trafficLights.isQueryRunning = false;
        plugin.trafficLights.circleLayer = L.layerGroup();
        plugin.trafficLights.circleUnion = L.layerGroup();
        window.addLayerGroup('Traffic Lights nearby', plugin.trafficLights.circleUnion, true);

        plugin.trafficLights.unionStyle = {
            fillColor  : '#FA0',
            fillOpacity: 0.2,
            color      : '#F00',
            opacity    : 0.5,
            weight     : 3
        }

        map.on('zoomend', window.plugin.trafficLights.searchTraffic);
        map.on('moveend', window.plugin.trafficLights.searchTraffic);

    }

// PLUGIN END //////////////////////////////////////////////////////////


    setup.info = plugin_info; //add the script info data to the function as a property
    if(!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
    if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


