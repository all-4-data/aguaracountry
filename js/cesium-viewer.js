// Asset IDs
const ASSET_3D_TILES = 3825903;
const ASSET_ORTHOPHOTO = 3823803;

let viewer = null;
let tileset = null;
let orthophotoLayer = null;
let is3DMode = true;
let initialCameraPosition = null;
let measurementMode = null; // 'distance' or null
let measurementPoints = [];
let measurementEntities = [];

function initViewer() {
    // Cesium Ion access token
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1Nzg2OTQzMC02YWViLTRhNzEtODNjNC04ZjAxY2YzMzJiN2IiLCJpZCI6MzQ1MzkzLCJpYXQiOjE3NTkxNTM1NTJ9.q05PcVsDp9UP2wK3YEoUtAaFBGW7TOcIXh8XR1FgPb8';

    viewer = new Cesium.Viewer('cesiumContainer', {
        geocoder: false,
        sceneModePicker: false,
        homeButton: false,
        navigationHelpButton: false,
        baseLayerPicker: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: false,
        selectionIndicator: false,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        // Set initial camera position at creation
        camera: {
            destination: Cesium.Cartesian3.fromDegrees(-58.5, -27.5, 10000),
            orientation: {
                heading: 0,
                pitch: Cesium.Math.toRadians(-45),
                roll: 0
            }
        }
    });
}

async function loadAssets() {
    try {
        // Set initial wide view first (approximate location)
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(-58.5, -27.5, 10000), // Very high altitude for wide view
            orientation: {
                heading: 0,
                pitch: Cesium.Math.toRadians(-45),
                roll: 0
            },
            duration: 0 // Immediate
        });

        // Load 3D tileset
        tileset = await Cesium.Cesium3DTileset.fromIonAssetId(ASSET_3D_TILES);
        viewer.scene.primitives.add(tileset);

        // Load orthophoto
        orthophotoLayer = await Cesium.ImageryLayer.fromProviderAsync(
            Cesium.IonImageryProvider.fromAssetId(ASSET_ORTHOPHOTO)
        );
        viewer.imageryLayers.add(orthophotoLayer);

        // Set initial camera position when tileset is ready
        await tileset.readyPromise;

        // Adjust tileset height to ground level
        const boundingSphere = tileset.boundingSphere;
        const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
        const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
        const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height);
        const translation = Cesium.Cartesian3.subtract(surface, offset, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

        // Load barrio contour
        await loadBarrioContour();

        setInitialCameraPosition();
        initMeasurementTools();
        hideLoading();

    } catch (error) {
        console.error('Error loading assets:', error);
        showError('Error al cargar el visor 3D');
    }
}

async function loadBarrioContour() {
    try {
        // Load GeoJSON contour
        const contourDataSource = await Cesium.GeoJsonDataSource.load('assets/aguara_contorno.geojson', {
            stroke: Cesium.Color.fromCssColorString('#D4941E'), // Aguara gold
            strokeWidth: 6,
            fill: Cesium.Color.TRANSPARENT, // No fill
            clampToGround: true
        });

        viewer.dataSources.add(contourDataSource);

        // Style all entities in the contour
        const entities = contourDataSource.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polygon) {
                // No fill, only outline
                entity.polygon.material = Cesium.Color.TRANSPARENT;
                entity.polygon.outline = true;
                entity.polygon.outlineColor = Cesium.Color.RED;
                entity.polygon.outlineWidth = 12; // Black border
                entity.polygon.height = 25;
                entity.polygon.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;

                // Add inner golden outline by creating a duplicate
                const goldenEntity = viewer.entities.add({
                    polygon: {
                        hierarchy: entity.polygon.hierarchy,
                        material: Cesium.Color.TRANSPARENT,
                        outline: true,
                        outlineColor: Cesium.Color.RED,
                        outlineWidth: 8, // Red border
                        height: 25,
                        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
                    }
                });
            }
            if (entity.polyline) {
                entity.polyline.material = Cesium.Color.BLACK;
                entity.polyline.width = 8;
                entity.polyline.clampToGround = true;

                // Add golden inner line
                viewer.entities.add({
                    polyline: {
                        positions: entity.polyline.positions,
                        material: Cesium.Color.fromCssColorString('#D4941E'),
                        width: 4,
                        clampToGround: true
                    }
                });
            }
        }

        // Add label in the center of the contour
        addBarrioLabel(contourDataSource);

        console.log('Barrio contour loaded successfully');
    } catch (error) {
        console.error('Error loading barrio contour:', error);
    }
}

function addBarrioLabel(contourDataSource) {
    // Calculate center point of the contour
    const entities = contourDataSource.entities.values;
    if (entities.length > 0) {
        const entity = entities[0];
        if (entity.polygon && entity.polygon.hierarchy) {
            const positions = entity.polygon.hierarchy.getValue().positions;
            if (positions && positions.length > 0) {
                // Calculate centroid
                let longitude = 0, latitude = 0;
                positions.forEach(pos => {
                    const cartographic = Cesium.Cartographic.fromCartesian(pos);
                    longitude += Cesium.Math.toDegrees(cartographic.longitude);
                    latitude += Cesium.Math.toDegrees(cartographic.latitude);
                });
                longitude /= positions.length;
                latitude /= positions.length;

                // Add label at specified coordinates
                viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(-58.73089012237533, -27.53339376278911, 50),
                    label: {
                        text: 'AGUARA COUNTRY CLUB',
                        font: '18px Arial',
                        fillColor: Cesium.Color.fromCssColorString('#D4941E'),
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        pixelOffset: new Cesium.Cartesian2(0, -50),
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    }
                });
            }
        }
    }
}

function initMeasurementTools() {
    viewer.canvas.addEventListener('click', function(event) {
        if (measurementMode) {
            const pickedPosition = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(event.clientX, event.clientY), viewer.scene.globe.ellipsoid);
            if (pickedPosition) {
                handleMeasurementClick(pickedPosition);
            }
        }
    });
}

function handleMeasurementClick(position) {
    measurementPoints.push(position);

    // Add point marker
    const pointEntity = viewer.entities.add({
        position: position,
        point: {
            pixelSize: 10,
            color: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
    });
    measurementEntities.push(pointEntity);

    if (measurementPoints.length === 2) {
        calculateMeasurement();
        measurementPoints = [];
        measurementMode = null;
        updateMeasurementButtons();
    }
}

function calculateMeasurement() {
    const point1 = measurementPoints[0];
    const point2 = measurementPoints[1];

    if (measurementMode === 'distance') {
        // Calculate horizontal distance
        const distance = Cesium.Cartesian3.distance(point1, point2);

        // Add line
        const lineEntity = viewer.entities.add({
            polyline: {
                positions: [point1, point2],
                width: 3,
                material: Cesium.Color.YELLOW,
                clampToGround: true
            }
        });
        measurementEntities.push(lineEntity);

        // Add label with distance
        const midpoint = Cesium.Cartesian3.midpoint(point1, point2, new Cesium.Cartesian3());
        const labelEntity = viewer.entities.add({
            position: midpoint,
            label: {
                text: `${distance.toFixed(2)} m`,
                font: '14px Arial',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -30),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });
        measurementEntities.push(labelEntity);
    }
}

function startDistanceMeasurement() {
    measurementMode = 'distance';
    measurementPoints = [];
    updateMeasurementButtons();
}


function clearMeasurements() {
    measurementEntities.forEach(entity => viewer.entities.remove(entity));
    measurementEntities = [];
    measurementPoints = [];
    measurementMode = null;
    updateMeasurementButtons();
}

function updateMeasurementButtons() {
    const distanceBtn = document.getElementById('measureDistanceBtn');
    distanceBtn.classList.toggle('active', measurementMode === 'distance');
}

function setInitialCameraPosition() {
    // Use zoomTo to get a closer ground-level view of the tileset
    viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(
        0, // heading
        Cesium.Math.toRadians(-60), // steeper pitch for more ground-level view
        tileset.boundingSphere.radius * 3 // closer range for 3D effect
    ));

    // Store the position for home button
    setTimeout(() => {
        const camera = viewer.camera;
        initialCameraPosition = {
            destination: camera.position.clone(),
            orientation: {
                heading: camera.heading,
                pitch: camera.pitch,
                roll: camera.roll
            }
        };
    }, 100);
}

function setupControls() {
    // Landing button
    document.getElementById('landingBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Home button
    document.getElementById('homeBtn').addEventListener('click', () => {
        if (initialCameraPosition) {
            viewer.camera.setView(initialCameraPosition);
        }
    });

    // 3D view toggle
    document.getElementById('view3DBtn').addEventListener('click', () => {
        toggle3DView();
    });

    // 2D view toggle
    document.getElementById('view2DBtn').addEventListener('click', () => {
        toggle2DView();
    });

    // Measurement tools
    document.getElementById('measureDistanceBtn').addEventListener('click', () => {
        startDistanceMeasurement();
    });

    document.getElementById('clearMeasurementsBtn').addEventListener('click', () => {
        clearMeasurements();
    });

    // Help button
    document.getElementById('helpBtn').addEventListener('click', () => {
        toggleHelp();
    });

    // Close help
    document.getElementById('closeHelp').addEventListener('click', () => {
        hideHelp();
    });

    // Fullscreen button
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        toggleFullscreen();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        switch(event.key) {
            case 'h':
            case 'H':
                if (initialCameraPosition) {
                    viewer.camera.setView(initialCameraPosition);
                }
                break;
            case '3':
                toggle3DView();
                break;
            case '2':
                toggle2DView();
                break;
            case '?':
                toggleHelp();
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
            case 'd':
            case 'D':
                startDistanceMeasurement();
                break;
            case 'c':
            case 'C':
                clearMeasurements();
                break;
            case 'Escape':
                hideHelp();
                break;
        }
    });
}

function toggle3DView() {
    if (!is3DMode) {
        is3DMode = true;
        if (tileset) tileset.show = true;
        if (orthophotoLayer) orthophotoLayer.show = false;

        document.getElementById('view3DBtn').classList.add('active');
        document.getElementById('view2DBtn').classList.remove('active');
    }
}

function toggle2DView() {
    if (is3DMode) {
        is3DMode = false;
        if (tileset) tileset.show = false;
        if (orthophotoLayer) orthophotoLayer.show = true;

        document.getElementById('view2DBtn').classList.add('active');
        document.getElementById('view3DBtn').classList.remove('active');
    }
}

function toggleHelp() {
    const helpPanel = document.getElementById('helpPanel');
    helpPanel.classList.toggle('hidden');
}

function hideHelp() {
    const helpPanel = document.getElementById('helpPanel');
    helpPanel.classList.add('hidden');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('hidden');
}

function showError(message) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingContent = loadingOverlay.querySelector('.loading-content');

    loadingContent.innerHTML = `
        <div style="color: #e74c3c;">
            <h3>❌ Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="background: #3498db; border: none; color: white; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                Reintentar
            </button>
        </div>
    `;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initViewer();
    loadAssets();
    setupControls();
});