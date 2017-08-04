var map;
var query_is_running = false;
var circleLayer = L.layerGroup();
var circleUnion;

//style for union result
var unionStyle = {
    fillColor: '#FA0',
    fillOpacity: 0.2,
    color: '#F00',
    opacity: 0.5,
    weight: 3
}

$(document).ready(function () {


    map = L.map('map').fitWorld();
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        maxZoom: 18
    }).addTo(map);

    navigator.geolocation.getCurrentPosition(function (pos) {
        var center = L.latLng(pos.coords.latitude, pos.coords.longitude);
        map.setView(center, 15);
    })

    map.on('zoomend', searchTraffic);
    map.on('moveend', searchTraffic);

})

function searchTraffic() {
    if (query_is_running) return;

    query_is_running = true;

    $.ajax({
        url: 'http://www.overpass-api.de/api/interpreter?data=' +
        '[out:json][timeout:25];' +
        '(node["highway"="traffic_signals"](' + getBbox() + '););' +
        'out body;' +
        '>;' +
        'out skel qt;',
        dataType: 'json',
        crossDomain: true,
        success: function (res) {
            if (circleUnion) {
                map.removeLayer(circleUnion);
            }

            query_is_running = false;
            for (var i in res.elements) {
                var center = L.latLng(res.elements[i].lat, res.elements[i].lon);
                // var obj = L.circle(center, {radius: 180, color: 'red'}).addTo(map);

                var circ = LGeo.circle(center, 180, {color: 'red'}).addTo(circleLayer);
            }

            circleUnion = unify(circleLayer.getLayers()).addTo(map);
        }
    })
}

function getBbox() {
    var bbox = map.getBounds();
    var a = bbox._southWest,
        b = bbox._northEast;
    return [a.lat, a.lng, b.lat, b.lng].join(",");
}

//union function using turf.js
function unify(polyList) {
    for (var i = 0; i < polyList.length; ++i) {
        if (i == 0) {
            var unionTemp = polyList[i].toGeoJSON();
        } else {
            unionTemp = turf.union(unionTemp, polyList[i].toGeoJSON());
        }
    }
    return L.geoJson(unionTemp, {style: unionStyle});
}