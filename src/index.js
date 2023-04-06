//DEFINISI KELAS
class Node {
    constructor(name, lat, lon) {
        this.name = name;
        this.lat = lat;
        this.lon = lon;
    }
    getLatitudeLongitude() {
        return [this.lat, this.lon];
    }
    findDistance(node) {
        return calculateDistance(this.lat, this.lon, node.lat, node.lon);
    }
}

class Graph {
    constructor() {
        this.nodes = [];
        this.adjacentMatrix = [];
        this.nodeArea = L.layerGroup([]);
        this.edgePaths = L.layerGroup([]);
        this.shortestPath = L.layerGroup([]);
    }

    getNode(name) {
        return this.nodes.find(node => node.name == name);
    }

    drawNodeMarker() {
        this.nodes.forEach(node =>
            this.nodeArea
              .addLayer(L.circle(node.getLatitudeLongitude(), {radius: 20}).bindPopup(node.name)));
    }

    drawEdgePath() {
        for (var i = 0; i < this.nodes.length; i++) {
            for (var j = 0; j <= i; j++) {
                if (this.adjacentMatrix[i][j] > 0) {
                    var line = L.polyline([this.nodes[i].getLatitudeLongitude(), this.nodes[j].getLatitudeLongitude()]);
                    line.bindPopup(String(this.adjacentMatrix[i][j]));
                    line.setText(String(this.adjacentMatrix[i][j]), {center: true});

                    this.edgePaths.addLayer(line);
                }
            }
        }
    }

    drawPath(path, map) {
        this.shortestPath.clearLayers();
        let sum = 0;
        for (let i = 0; i < path.length-1; i++) {
            let from = this.getNode(path[i]);
            let to = this.getNode(path[i+1]);
            var line = L.polyline([from.getLatitudeLongitude(), to.getLatitudeLongitude()], {color:'red'});
            this.shortestPath.addLayer(line);
            this.shortestPath.addTo(map);

            sum += calculateDistance(from.lat,from.lon,to.lat,to.lon);
        }

        let textsum = document.getElementById("sum-path");
        textsum.innerHTML="Shortest path's distance: "+sum.toString();
    }

    draw(map) {
        this.drawNodeMarker();
        this.drawEdgePath();
        this.edgePaths.addTo(map);
        this.nodeArea.addTo(map);
    }

    clear() {
        this.shortestPath.clearLayers();
        this.edgePaths.clearLayers();
        this.nodeArea.clearLayers();
    }
    
    getIndex(name) {
        return this.nodes.findIndex(x => x.name == name);
    }
}

//DEFINISI FUNGSI HELPER
function calculateDistance(latitude1,longitude1,latitude2,longitude2) {
    var R = 6371; // radius bumi dalam km
    var _latitude = derajatToRadian(latitude2-latitude1);
    var _longitude = derajatToRadian(longitude2-longitude1); 
    var a = 
      Math.sin(_latitude/2) * Math.sin(_latitude/2) +
      Math.cos(derajatToRadian(latitude1)) * Math.cos(derajatToRadian(latitude2)) * 
      Math.sin(_longitude/2) * Math.sin(_longitude/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d;
  }
  
function derajatToRadian(deg) {
    return deg * (Math.PI/180)
}

//VARIABEL GLOBAL
let map = L.map('mapid').setView([-6.889295, 107.610365], 17);
var graph = new Graph();

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

L.marker([-6.889295, 107.610365]).addTo(map)
    .bindPopup('ITB')
    .openPopup();

function onMapClick(e) {
    alert("You clicked the map at " + e.latlng);
}


const readDataset = (event) => {
    let dataset = new FileReader();
    dataset.onload = function(event){
        var data = JSON.parse(event.target.result);
        main(data.nodes, data.edges);
    };
    dataset.readAsText(event.target.files[0]);
}

const main = (nodes, edges) => {
    graph.clear();
    let from = document.getElementById("from-node");
    let goal = document.getElementById("to-node");
    if (from.length != 0 || goal.length!=0){
        while(from.length!=0 && goal.length!=0){
            from.remove(from.i);
            goal.remove(goal.i);
            i++;
        }
    }
    
    let nodeArr = [];
    for (let node of nodes) {
        let tnode = new Node(node.name, node.lat, node.lon);
        nodeArr.push(tnode);
    }

    for (let node of nodes){
        let elmtfrom = document.createElement("option");
        let elmtto = document.createElement("option");
        elmtfrom.text = node.name;
        elmtto.text = node.name;
        document.getElementById("from-node").add(elmtfrom);
        document.getElementById("to-node").add(elmtto);
    }
    
    graph.nodes = nodeArr;
    
    let matrix = [];
    for(let i=0; i<nodeArr.length; i++){
        matrix[i] = [];
        for(let j=0; j<nodeArr.length; j++){
            matrix[i][j] = 0;
        }
    }

    for (let edge of edges){
        var idx = 0;
        let idx_from_found = false;
        let idx_to_found = false;
        var idx_from=-1;
        var idx_to=-1;
        while (idx < nodeArr.length && (!idx_from_found || !idx_to_found)){
            if (edge.from == nodeArr[idx].name && !idx_from_found){
                idx_from = idx;
                idx_from_found = true;
            } 
            if (edge.to == nodeArr[idx].name && !idx_to_found){
                idx_to = idx;
                idx_to_found = true;
            }
            idx++;
        }
        let dist = calculateDistance(nodeArr[idx_from].lat, nodeArr[idx_from].lon, nodeArr[idx_to].lat, nodeArr[idx_to].lon);
        matrix[idx_from][idx_to] = dist.toPrecision(4);
        matrix[idx_to][idx_from] = dist.toPrecision(4);
    }
    graph.adjacentMatrix = matrix;
    graph.draw(map);
}

// FUNGSI USC

// FUNGSI A*