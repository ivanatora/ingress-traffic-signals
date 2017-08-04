var map;
var query_is_running = false;
var elements = [];

$(document).ready(function () {


    map = L.map('map').fitWorld();
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        maxZoom: 18
    }).addTo(map);

    navigator.geolocation.getCurrentPosition(function (pos) {
        var center = L.latLng(pos.coords.latitude, pos.coords.longitude);
        map.setView(center, 14);
    })

    map.on('zoomend', searchTraffic);
    map.on('moveend', searchTraffic);

})

function searchTraffic() {
    if (query_is_running) return;

    console.log('in search')


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
            query_is_running = false;
            console.log('got something', res)
            for (var i in res.elements) {
                var id = res.elements[i].id;
                if (typeof (elements[id]) == 'undefined') {
                    var center = L.latLng(res.elements[i].lat, res.elements[i].lon);
                    var obj = L.circle(center, {radius: 180, color: 'red'}).addTo(map);
                    elements[id] = obj;
                }
            }
        }
    })
}

function getBbox (){
    var bbox = map.getBounds();
    var a = bbox._southWest,
        b = bbox._northEast;
    return [a.lat, a.lng, b.lat, b.lng].join(",");
}