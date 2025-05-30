// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Create map centered on the hiking area
    const map = L.map('map').setView([52.511259, 13.24283], 14);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Custom icon for markers
    function createCustomMarkerIcon(pointId) {
        return L.divIcon({
            className: 'custom-marker',
            html: pointId,
            iconSize: [30, 30]
        });
    }

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

    // Load key points data
    fetch('key_points.json')
        .then(response => response.json())
        .then(pointsData => {
            // Create markers and route point elements
            const routePointsContainer = document.getElementById('route-points');
            const markers = {};
            
            pointsData.forEach(point => {
                // Format distance for display
                const distanceText = point.distance >= 1000 
                    ? `${(point.distance / 1000).toFixed(2)} km` 
                    : `${Math.round(point.distance)} m`;
                
                const overallDistanceText = point.overall_distance >= 1000 
                    ? `${(point.overall_distance / 1000).toFixed(2)} km` 
                    : `${Math.round(point.overall_distance)} m`;
                
                // Create marker with popup
                const marker = L.marker([point.lat, point.lon], {
                    icon: createCustomMarkerIcon(point.id)
                }).addTo(map);
                
                const popupContent = `
                    <div class="popup-content">
                        <h3>Point ${point.id}</h3>
                        <p>${point.description}</p>
                        <p><strong>Distance:</strong> ${distanceText}</p>
                        <p><strong>Overall:</strong> ${overallDistanceText}</p>
                        <div class="btn-details" data-point-id="${point.id}">View Details</div>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                markers[point.id] = marker;
                
                // Create route point element
                const routePointElement = document.createElement('div');
                routePointElement.className = 'route-point fade-in';
                routePointElement.id = `point-${point.id}`;
                routePointElement.innerHTML = `
                    <h3><span>${point.id}</span> ${point.description}</h3>
                    <p>Follow this section for ${distanceText}</p>
                    <div class="distance">
                        <span>Elevation: ${Math.round(point.elevation)} m</span>
                        <span>Overall: ${overallDistanceText}</span>
                    </div>
                `;
                
                // Add click event to route point element
                routePointElement.addEventListener('click', function() {
                    // Highlight the clicked point
                    highlightPoint(point.id);
                    
                    // Open the marker popup
                    marker.openPopup();
                    
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
                
                // Add pulse animation to the marker
                Object.keys(markers).forEach(id => {
                    const markerElement = markers[id].getElement();
                    if (markerElement) {
                        markerElement.classList.remove('active');
                    }
                });
                
                const activeMarkerElement = markers[pointId].getElement();
                if (activeMarkerElement) {
                    activeMarkerElement.classList.add('active');
                }
            }
            
            // Initialize fade-in animations
            initFadeInAnimations();
        })
        .catch(error => console.error('Error loading key points data:', error));
});
