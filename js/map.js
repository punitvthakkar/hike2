// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Create map centered on the hiking area
    const map = L.map('map').setView([52.511259, 13.24283], 14);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Maplibre',
        maxZoom: 19
    }).addTo(map);

    // Custom icon for markers
    function createCustomMarkerIcon(pointId, isActive = false) {
        const markerColor = isActive ? '#388E3C' : (pointId <= 13 ? '#d32f2f' : '#4CAF50');
        const textColor = '#ffffff';
        
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${markerColor}; color: ${textColor}; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">${pointId}</div>`,
            iconSize: [30, 30]
        });
    }

    // Define the marker positions based on the reference image
    const markerPositions = [
        {id: 1, lat: 52.5135, lon: 13.2650, description: "On access road head west"},
        {id: 2, lat: 52.5125, lon: 13.2600, description: "Left and follow Path"},
        {id: 3, lat: 52.5110, lon: 13.2610, description: "Left and follow Path"},
        {id: 4, lat: 52.5080, lon: 13.2680, description: "Right and follow Path"},
        {id: 5, lat: 52.5080, lon: 13.2670, description: "Left on Flatowallee"},
        {id: 6, lat: 52.5070, lon: 13.2550, description: "Slight right on Kranzallee"},
        {id: 7, lat: 52.5060, lon: 13.2450, description: "Left on Path"},
        {id: 8, lat: 52.5070, lon: 13.2420, description: "Right and follow Path"},
        {id: 9, lat: 52.5080, lon: 13.2400, description: "Right and follow Path"},
        {id: 10, lat: 52.5090, lon: 13.2380, description: "Left and follow Path"},
        {id: 11, lat: 52.5100, lon: 13.2450, description: "Right and follow Path"},
        {id: 12, lat: 52.5110, lon: 13.2520, description: "Left and follow Hiking Path (SAC T1)"},
        {id: 13, lat: 52.5120, lon: 13.2550, description: "Slight right and follow Hiking Path (SAC T1)"}
    ];

    // Load route line data
    fetch('route_line.json')
        .then(response => response.json())
        .then(routeData => {
            // Create an array of LatLng objects for the polyline
            const routePoints = routeData.map(point => [point.lat, point.lon]);
            
            // Add the route line to the map
            const routeLine = L.polyline(routePoints, {
                color: '#4CAF50',
                weight: 5,
                opacity: 0.7,
                lineJoin: 'round'
            }).addTo(map);
            
            // Fit the map to the route bounds
            map.fitBounds(routeLine.getBounds());
        })
        .catch(error => console.error('Error loading route data:', error));

    // Load hiking point descriptions
    fetch('key_points.json')
        .then(response => response.json())
        .then(pointsData => {
            // Create a lookup for descriptions and distances
            const pointDetails = {};
            pointsData.forEach(point => {
                pointDetails[point.id] = {
                    description: point.description,
                    distance: point.distance,
                    overall_distance: point.overall_distance,
                    elevation: point.elevation
                };
            });
            
            // Create markers and route point elements
            const routePointsContainer = document.getElementById('route-points');
            const markers = {};
            
            markerPositions.forEach(marker => {
                // Get details from the original data if available
                const details = pointDetails[marker.id] || {};
                const description = marker.description || details.description || '';
                const distance = details.distance || 0;
                const overallDistance = details.overall_distance || 0;
                const elevation = details.elevation || 0;
                
                // Format distance for display
                const distanceText = distance >= 1000 
                    ? `${(distance / 1000).toFixed(2)} km` 
                    : `${Math.round(distance)} m`;
                
                const overallDistanceText = overallDistance >= 1000 
                    ? `${(overallDistance / 1000).toFixed(2)} km` 
                    : `${Math.round(overallDistance)} m`;
                
                // Create marker with popup
                const markerObj = L.marker([marker.lat, marker.lon], {
                    icon: createCustomMarkerIcon(marker.id)
                }).addTo(map);
                
                const popupContent = `
                    <div class="popup-content">
                        <h3>Point ${marker.id}</h3>
                        <p>${description}</p>
                        <p><strong>Distance:</strong> ${distanceText}</p>
                        <p><strong>Overall:</strong> ${overallDistanceText}</p>
                        <div class="btn-details" data-point-id="${marker.id}">View Details</div>
                    </div>
                `;
                
                markerObj.bindPopup(popupContent);
                markers[marker.id] = markerObj;
                
                // Create route point element
                const routePointElement = document.createElement('div');
                routePointElement.className = 'route-point fade-in';
                routePointElement.id = `point-${marker.id}`;
                routePointElement.innerHTML = `
                    <h3><span>${marker.id}</span> ${description}</h3>
                    <p>Follow this section for ${distanceText}</p>
                    <div class="distance">
                        <span>Elevation: ${Math.round(elevation)} m</span>
                        <span>Overall: ${overallDistanceText}</span>
                    </div>
                `;
                
                // Add click event to route point element
                routePointElement.addEventListener('click', function() {
                    // Highlight the clicked point
                    highlightPoint(marker.id);
                    
                    // Open the marker popup
                    markerObj.openPopup();
                    
                    // Scroll to the map if not in view
                    document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
                });
                
                routePointsContainer.appendChild(routePointElement);
            });
            
            // Add click event to popup "View Details" buttons
            map.on('popupopen', function(e) {
                const detailsBtn = e.popup._contentNode.querySelector('.btn-details');
                if (detailsBtn) {
                    detailsBtn.addEventListener('click', function() {
                        const pointId = this.getAttribute('data-point-id');
                        
                        // Scroll to the route point details
                        const pointElement = document.getElementById(`point-${pointId}`);
                        pointElement.scrollIntoView({ behavior: 'smooth' });
                        
                        // Highlight the point
                        highlightPoint(pointId);
                    });
                }
            });
            
            // Function to highlight a point
            function highlightPoint(pointId) {
                // Remove active class from all route points
                document.querySelectorAll('.route-point').forEach(el => {
                    el.classList.remove('active');
                });
                
                // Add active class to the selected point
                const pointElement = document.getElementById(`point-${pointId}`);
                pointElement.classList.add('active');
                
                // Update marker icons
                Object.keys(markers).forEach(id => {
                    const isActive = id === pointId;
                    markers[id].setIcon(createCustomMarkerIcon(id, isActive));
                });
            }
            
            // Initialize fade-in animations
            initFadeInAnimations();
        })
        .catch(error => console.error('Error loading key points data:', error));
});
