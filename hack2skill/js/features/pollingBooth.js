export function setupPollingBooth() {
    window.findPollingBooth = function() {
        const voterId = document.getElementById('booth-voter-id').value.trim().toUpperCase();
        const partNo = document.getElementById('booth-part-no').value.trim();
        const resultDiv = document.getElementById('booth-result');

        if (!voterId || !partNo) {
            resultDiv.style.display = 'block';
            resultDiv.style.backgroundColor = '#FEF2F2';
            resultDiv.style.color = '#B91C1C';
            resultDiv.innerHTML = '<p>Please enter both Voter ID and Part Number.</p>';
            return;
        }

        // Mock polling booth data
        const boothData = {
            'ABC1234567-159': {
                booth: 'Govt High School, Room 1',
                location: 'Bhabanipur, Kolkata',
                address: '123 School Street, Kolkata - 700045',
                hours: '7:00 AM - 6:00 PM',
                distance: '0.5 km',
                lat: '22.5355',
                lng: '88.3472'
            },
            'XYZ9876543-210': {
                booth: 'Community Center, Sector 4',
                location: 'Nandigram, West Bengal',
                address: 'Sector 4, Nandigram - 721628',
                hours: '7:00 AM - 6:00 PM',
                distance: '1.2 km',
                lat: '22.0206',
                lng: '88.0918'
            },
            'LMN4567890-150': {
                booth: 'Primary School, Block B',
                location: 'Jadavpur, Kolkata',
                address: '456 School Lane, Jadavpur - 700032',
                hours: '7:00 AM - 6:00 PM',
                distance: '0.8 km',
                lat: '22.4976',
                lng: '88.3870'
            }
        };

        const key = `${voterId}-${partNo}`;
        const booth = boothData[key];

        resultDiv.style.display = 'block';

        if (booth) {
            resultDiv.style.backgroundColor = '#F0FDF4';
            resultDiv.style.color = '#15803D';
            
            // Generate Google Maps Iframe
            const mapsIframe = `<iframe 
                width="100%" 
                height="200" 
                style="border:0; border-radius: 8px; margin-top: 10px;" 
                loading="lazy" 
                allowfullscreen 
                src="https://maps.google.com/maps?q=${booth.lat},${booth.lng}&hl=en&z=15&output=embed">
            </iframe>`;

            resultDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <span style="font-size: 1.25rem;">📍</span>
                    <strong>Your Polling Booth</strong>
                </div>
                <div style="background: rgba(255,255,255,0.7); padding: 1rem; border-radius: 8px;">
                    <p style="margin: 0.5rem 0;"><strong>Booth:</strong> ${booth.booth}</p>
                    <p style="margin: 0.5rem 0;"><strong>Location:</strong> ${booth.location}</p>
                    <p style="margin: 0.5rem 0;"><strong>Address:</strong> ${booth.address}</p>
                    <p style="margin: 0.5rem 0;"><strong>Hours:</strong> ${booth.hours}</p>
                    <p style="margin: 0.5rem 0;"><strong>Distance:</strong> ${booth.distance}</p>
                    ${mapsIframe}
                </div>
            `;
        } else {
            resultDiv.style.backgroundColor = '#FEF2F2';
            resultDiv.style.color = '#B91C1C';
            resultDiv.innerHTML = '<p>No booth found for these credentials. Visit the official ECI portal for accurate information.</p>';
        }
    };
}
