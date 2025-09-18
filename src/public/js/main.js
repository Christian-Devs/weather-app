; (function ($) {
    const $address = $('#address');
    const $results = $('#weather-result');
    const $history = $('#history-result');
    const $save = $('#btn-save');

    //render the weather data card
    function renderWeather(data) {
        const { address, place_name, lat, lon, summary } = data;
        const now = summary.now;
        const $card = $(`
            <div class="card border-primary mt-2">
                <div class="card-body">
                    <h5 class="card-title">${place_name}</h5>
                    <p class="card-text">(${lat.toFixed(4)}, ${lon.toFixed(4)})</p>
                    <div class="d-flex align-items-center">
                        <img src="https://openweathermap.org/img/wn/${now.icon}@2x.png" alt="icon"/>
                        <div class="ml-3">
                            <div class="display-4">${Math.round(now.temp)}°C</div>
                            <div>${now.weather} - feels ${Math.round(now.feels_like)}°C</div>
                        </div>
                    </div>
                    <hr/>
                    <div id="hourly-forecast" class="d-flex flex-wrap"></div>
                </div>
            </div>
        `);
        summary.next24h.forEach(item => {
            $('#hourly-forecast', $card).append(`
                <div class="text-center p-2 style="width: 90px;">
                    <div class="small">${item.time.replace(' ', '\n')}</div>
                    <img src="https://openweathermap.org/img/wn/${item.icon}.png" alt="icon"/>
                    <div>${Math.round(item.temp)}°C</div>
                    <div class="small">${item.weather}</div>
                </div>
            `);
        });
        $results.empty().append($card);
    }

    // Render a saved weather history record card
    function renderSavedCard(record) {
        console.log('Rendering saved record', record);
        const current = typeof record.current === 'string' ? JSON.parse(record.current) : (record.current || {});
        const hourly = typeof record.hourly === 'string' ? JSON.parse(record.hourly) : (record.hourly || {});

        const now = {
            temp: current?.main?.temp,
            feels_like: current?.main?.feels_like,
            weather: current?.weather?.[0]?.description,
            icon: current?.weather?.[0]?.icon,
        };

        const nextHours = (hourly?.list || []).slice(0, 8).map(h => ({
            time: h?.dt_txt,
            temp: h?.main?.temp,
            icon: h?.weather?.[0]?.icon,
            weather: h?.weather?.[0]?.description,
        }));

        const latNum = parseFloat(record.lat);
        const lonNum = parseFloat(record.lon);

        const $card = $(`
            <div class="card border-success mt-2">
                <div class="card-body">
                    <h5 class="card-title">${record.address}</h5>
                    <p class="card-text">(${latNum.toFixed(4)}, ${lonNum.toFixed(4)})</p>

                    <div class="d-flex align-items-center">
                        <img src="https://openweathermap.org/img/wn/${now.icon}@2x.png" alt="icon"
                            onerror="this.onerror=null;this.src='https://openweathermap.org/img/wn/01d@2x.png';"/>
                        <div class="ms-3">
                            <div class="display-4">${Number.isFinite(now.temp) ? Math.round(now.temp) + '°C' : '—'}</div>
                            <div>${now.weather || '—'}${Number.isFinite(now.feels_like) ? ' · feels ' + Math.round(now.feels_like) + '°C' : ''}</div>
                        </div>
                    </div>
                    <hr/>
                    <div id="hourly-forecast" class="d-flex flex-wrap saved-hourly"></div>
                </div>
            </div>
        `);
        nextHours.forEach(item => {
            $('#hourly-forecast', $card).append(`
                <div class="text-center p-2 style="width: 90px;">
                    <div class="small">${item.time.replace(' ', '\n')}</div>
                    <img src="https://openweathermap.org/img/wn/${item.icon}.png" alt="icon"/>
                    <div>${Math.round(item.temp)}°C</div>
                    <div class="small">${item.weather}</div>
                </div>
            `);
        });

        return $card;
    }

    // Fetch weather data from the server API
    async function fetchWeather(address) {
        const res = await fetch('/api/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });
        if (!res.ok) {
            throw new Error(error || 'Failed to fetch weather');
        }
        return res.json();
    }

    // Save the current weather data to the db
    async function save(payload) {
        const res = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            let msg = 'Failed to save';
            try {
                const j = await res.json();
                if (j?.error) msg = j.error;
            } catch { }
            throw new Error(msg);
        }
        return res.json();
    }

    // Fetch and render the saved weather history
    async function getSavedHistory() {
        const res = await fetch('/api/saved');
        if (!res.ok) {
            throw new Error('Failed to fetch saved history');
        }
        const data = await res.json();
        $history.empty();
        if (!data.items.length) {
            $history.append('<p>No saved history</p>');
            return;
        }
        const list = $('<ul class="list-group"></ul>');
        data.items.forEach(item => {
            const $item = $(`
                <li class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold">${item.address}</div>
                            <div class="small text-muted">${new Date(item.created_at).toLocaleString()}</div>
                        </div>
                        <button class="btn btn-sm btn-outline-primary view-btn">View</button>
                    </div>
                    <div class="saved-details collapse mt-2"></div>
                </li>
            `);
            $item.find('.view-btn').on('click', async () => {
                const $details = $item.find('.saved-details');

                if ($details.is(':visible')) {
                    $details.hide().empty();
                    return;
                }
                const res = await fetch(`/api/saved${item.id}`);
                const full = await res.json();
                const normalized = {
                    ...full,
                    current: full.current ?? full.current_forecast,
                    hourly: full.hourly ?? full.hourly_forecast,
                    lon: full.lon
                };

                const $card = renderSavedCard(normalized);
                $details.empty().append($card).show();
            });
            list.append($item);
        });
        $history.append(list);
    }

    //Binding the fetch button to get the weather data
    $('#btn-fetch-js').on('click', async () => {
        try {
            const address = ($address.val() || '').trim();
            if (!address) return alert('Please enter an address');

            const data = await fetchWeather(address);
            window.__LAST__ = data;
            renderWeather(data);
            $save.prop('disabled', false);
        } catch (e) {
            alert(e.message || String(e));
        }
    });

    //binding the history button to fetch and show saved history
    $('#btn-history').on('click', getSavedHistory);

    //binding the save button to save the current weather data
    $save.on('click', async () => {
        if (!window.__LAST__) {
            return alert('Get weather first');
        }
        try {
            await save({
                address: window.__LAST__.address,
                lat: window.__LAST__.lat,
                lon: window.__LAST__.lon,
                current: window.__LAST__.current,
                hourly: window.__LAST__.hourly
            });
            alert('Saved successfully');
            $save.prop('disabled', true);
        } catch (e) {
            alert('Failed to save: ' + e.message);
        }
    });

    if (window.__INITIAL__) {
        window.__LAST__ = window.__INITIAL__;
        renderWeather(window.__INITIAL__);
        $save.prop('disabled', false);
    }
})(window.jQuery);