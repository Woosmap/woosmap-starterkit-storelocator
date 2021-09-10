(() => {
    const meterToYard = 1.09361;
    const unitSystem = 'metric'; // or 'imperial'
    const mobileBreakPoint = 750;
    let currentWidth = 0;
    const minZoomLevelStore = 12;

    const woosmapLoadOptions = {
        version: '1.4',
        publicKey: 'woos-48c80350-88aa-333e-835a-07f4b658a9a4', //replace with your public key
        callback: woosmap_main,
        loadJQuery: true
    };
    const localitiesOptions = {
        components: {},
        types: ["locality", "postal_code", "admin_level", "country", "airport", "metro_station", "train_station"]
    };
    const googleLoadOptions = {
        key: "AIzaSyBn3kw1bNdgmiXAczwr2DcKLAaW-M3nX14",
        language: "en",
        region: "GB",
        version: "3.39"
    };
    const googleMapsOptions = {
        center: {
            lat: 48,
            lng: 2
        },
        zoom: 4,
        scrollwheel: true,
        mapTypeControl: false,
        fullscreenControl: false,
        styles: [
            {
                featureType: 'poi',
                stylers: [{visibility: 'off'}]
            },
            {
                featureType: 'transit',
                elementType: 'labels.icon',
                stylers: [{visibility: 'off'}]
            }
        ]
    };
    const woosmapOptions = {
        style: {
            'default': {
                'icon': {
                    url: './images/markers/starbucks-marker.svg',
                    scaledSize: {
                        height: 47,
                        width: 40
                    },
                },
                'numberedIcon': {
                    url: './images/markers/starbucks-marker.svg',
                    scaledSize: {
                        height: 47,
                        width: 40
                    },
                },
                'selectedIcon': {
                    url: './images/markers/starbucks-marker-selected.svg',
                    scaledSize: {
                        height: 71,
                        width: 61
                    }
                }
            }
        },
        tileStyle: {
            color: '#008248',
            size: 15,
            minSize: 4
        },
        breakPoint: 12,
        padding: {left: 50, right: 50, bottom: 50, top: 50},

    };
    const distanceOptions = {
        distanceapiUrl: 'https://api.woosmap.com/distance/distancematrix/json?',
        units: unitSystem,
        mode: 'driving',
        language: 'en',
        elements: 'duration_distance',
        key: 'woos-48c80350-88aa-333e-835a-07f4b658a9a4'
    };

    const availableServices = [
        {serviceKey: 'WF', serviceName: 'Wireless Hotspot'},
        {serviceKey: 'CD', serviceName: 'Mobile Payment'},
        {serviceKey: 'DT', serviceName: 'Drive-Thru'},
        {serviceKey: 'DR', serviceName: 'Digital Rewards'},
        {serviceKey: 'hrs24', serviceName: 'Open 24 hours per day'},
        {serviceKey: 'WA', serviceName: 'Oven-warmed Food'},
        {serviceKey: 'LB', serviceName: 'LaBoulange'},
        {serviceKey: 'XO', serviceName: 'Mobile Order and Pay'},
        {serviceKey: 'VS', serviceName: 'Verismo'},
        {serviceKey: 'NB', serviceName: 'Nitro Cold Brew'},
        {serviceKey: 'CL', serviceName: 'Starbucks Reserve-Clover Brewed'},
    ];

    const selectedStoreTemplate = "<div class='woosmap-tableview-cell'><div class='screen-filter'></div>" +
        "<div id='back-to-results'></div><div class='store-photo-header'></div>" +
        "<div class='selected-store-card'><div class='hero'>" +
        "<div class='store-title'>{{name}}</div>" +
        "{{#types}}<div class='store-types'>{{types}}</div>{{/types}}" +
        "{{#openlabel}}<div class='store-opened'>{{openlabel}}</div>{{/openlabel}}</div>" +
        "<div class='content'><div class='store-address'>{{address.lines}}</div>" +
        "{{#contact.phone}}<div class='store-contact'><a href='tel:{{contact.phone}}'>{{contact.phone}}</a></div>{{/contact.phone}}" +
        "{{#contact.website}}<div class='store-website'><a href='{{contact.website}}' target='_blank'>Go to website</a></div>{{/contact.website}}" +
        "<div class='store-direction-url'><a href='{{directionUrl}}' target='_blank'>Get Direction</a></div>" +
        "</div></div>" +
        "{{#open}}<div class='store-properties-list'><div class='store-properties-header'>Opening hours</div>" +
        "<ul class='store-opening-hours-list'>" +
        "{{#week}}<li {{#current}}class='current-day'{{/current}}><span class='day'>{{dayName}}</span><span class='hours'>{{hoursDay}}</span></li>{{/week}}" +
        "</ul></div>{{/open}}" +
        "{{#hasServices}}<div class='store-properties-list'><div class='store-properties-header'>Services</div>" +
        "<ul class='store-services-list'>" +
        "{{#services}}<li><div class='icon-service icon-{{serviceKey}}'></div><div class='flex-grow'>{{serviceName}}</div></li>{{/services}}" +
        "</ul></div>{{/hasServices}}" +
        "</div>";

    const summaryStoreTemplate = "<div class='controls summary-store-card'><div>" +
        "<div><strong>{{name}} - {{address.city}}</strong></div>" +
        "<div><div class='store-address'>{{address.lines}}</div>" +
        "{{#contact.phone}}<div  class='store-contact'><a href='tel:{{contact.phone}}'>{{contact.phone}}</a></div>{{/contact.phone}}" +
        "<div class='store-distance'>{{storeDistance}}</div>" +
        "</div></div>" +
        "<div class='store-photo'><img src='./images/default.svg' alt='store image'/></div></div>";

    const filtersTagTemplate = "<ul>" +
        "{{#availableServices}}<li data-servicekey='{{serviceKey}}' data-servicename='{{serviceName}}'><button>" +
        "<div class='icon-service icon-{{serviceKey}}'></div>" +
        "<div class='flex-grow'>{{serviceName}}</div>" +
        "<div class='active-icon-wrapper'>" +
        "</div></button></li>{{/availableServices}}" +
        "</ul>"

    let map;
    let mapView;
    let dataSource;
    let selectedStoreObj;
    let currentStoreId;
    let markerHover = null;
    let searchQuery = '';
    const photosSrcFull = ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg", "16.jpg", "17.jpg", "18.jpg", "19.jpg", "20.jpg", "21.jpg", "22.jpg", "23.jpg"];

    function debounce(func, wait, immediate) {
        let timeout;
        return function () {
            let context = this;
            let args = arguments;
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    String.prototype.capitalize = function () {
        return this.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
    };


    function getReadableDistance(distance) {
        const value = {
            'metric': {unit: 'km', smallUnit: 'm', factor: 1000},
            'imperial': {unit: 'mi', smallUnit: 'yd', factor: 1760}
        };
        const system = value[unitSystem];
        if (unitSystem === 'imperial') {
            distance *= meterToYard;
        }
        if (distance < system.factor) {
            return `${Math.round(distance)}\u00A0${system.smallUnit}`;
        } else {
            return `${parseFloat((distance / system.factor).toFixed(1))}\u00A0${system.unit}`;
        }
    }


    function manageMobileView() {
        const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        if (currentWidth !== width) {
            if (width >= mobileBreakPoint) {
                if (!document.querySelector("#sidebar").contains(document.querySelector("#search-container"))) {
                    document.querySelector("#sidebar").insertBefore(document.querySelector("#search-container"), document.querySelector("#sidebar").childNodes[0]);
                    document.body.classList.remove("mobile");
                    woosmapOptions.padding.top = 50;
                }
            } else {
                if (!document.querySelector("#my-map-container").contains(document.querySelector("#search-container"))) {
                    document.querySelector("#my-map-container").insertBefore(document.querySelector("#search-container"), document.querySelector("#my-map-container").childNodes[0]);
                    document.body.classList.add("mobile");
                    woosmapOptions.padding.top = 100;
                }
            }
            currentWidth = width;
        }
    }

    function renderPhoto(cell, selector, photosSrc, rootPath) {
        cell.querySelector(selector).style.backgroundImage = `url(${rootPath}${photosSrc[Math.floor(Math.random() * photosSrc.length)]})`;
    }

    function getURLParameter(name) {
        return decodeURIComponent((new RegExp(`[?|&]${name}=([^&;]+?)(&|#|;|$)`).exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
    }

    function initSearchParam() {
        let location = getURLParameter('location');
        if (location && location.split(",").length > 0) {
            search({lat: location.split(",")[0], lng: location.split(",")[1]});
        }
    }


    function styleOnScroll() {
        const listingStores = document.querySelector('#listing-stores-container');
        listingStores.addEventListener('scroll', (() => {
            const scroll = listingStores.scrollTop;
            if (scroll > 0) {
                listingStores.classList.add("active");
            } else {
                listingStores.classList.remove("active");
            }
        }));
    }

    function toggleAndSlideTableview(selectedStoreCell) {
        const selectedStoreHTML = document.querySelector('#selected-store-container');
        const listingStores = document.querySelector('#listing-stores-container');
        if (selectedStoreCell) {
            listingStores.classList.remove('animated', 'fadeOutLeft', 'fadeInLeft');
            listingStores.classList.add('animated', 'fadeOutLeft');
            if (!selectedStoreHTML.classList.contains("fadeInRight")) {
                selectedStoreHTML.className = '';
                selectedStoreHTML.classList.add('animated', 'fadeInRight');
                selectedStoreHTML.addEventListener("animationend", () => {
                    selectedStoreHTML.classList.remove('animated');
                }, {once: true});
            }
            document.querySelector('#search-container').classList.add('selected-store');
            selectedStoreHTML.style.display = 'block';
            selectedStoreHTML.innerHTML = selectedStoreCell;
            if (listingStores.classList.contains('home')) {
                document.querySelector('#back-to-results').innerHTML = 'Back to home';
            } else {
                document.querySelector('#back-to-results').innerHTML = 'Back to results';
            }
            document.querySelector('#back-to-results').addEventListener('click', () => {
                toggleAndSlideTableview();
                clearMapSelectedStore();
                setSearchBounds();
            });
            renderPhoto(selectedStoreHTML, '.store-photo-header', photosSrcFull, "./images/full/");
            selectedStoreHTML.scrollTo({top: 0});
        } else {
            selectedStoreHTML.className = '';
            selectedStoreHTML.classList.add('animated', 'fadeOutRight');
            listingStores.className = '';
            listingStores.classList.add('animated', 'fadeInLeft');
            listingStores.scrollTo({top: 0});
            document.querySelector('#search-container').classList.remove('selected-store');
        }
    }

    function setMarkerHover(latlng) {
        markerHover = new google.maps.Marker({
            map,
            position: latlng,
            icon: './images/markers/starbucks-marker-hovered.svg',
            zIndex: 1000
        });
    }

    function centerAndZoom({geometry}) {
        if (map.getZoom() < minZoomLevelStore) {
            woosmap.maps.utils.centerAndZoom(map, {
                lat: geometry.coordinates[1],
                lng: geometry.coordinates[0]
            }, minZoomLevelStore);
        } else {
            mapView.panTo({
                    lat: geometry.coordinates[1],
                    lng: geometry.coordinates[0]
                },
                woosmapOptions.padding);
        }
    }

    function clearMapSelectedStore() {
        mapView.set('selectedStore', null);
    }

    function setSearchBounds() {
        mapView.fitBounds(mapView.getDataBounds());
    }

    function filterByTags() {
        const q = woosmap.query;
        let fields = [];
        searchQuery = '';
        document.querySelectorAll('.filters-list .active-filter').forEach(filterObj => {
            fields.push(q.F('tag', filterObj.dataset.servicekey));
        });
        if (fields.length > 0)
            searchQuery = q.and(fields);
        mapView.setSearchParameters(new woosmap.search.SearchParameters({query: searchQuery}));
        search(mapView.get('location'));
    }


    function concatenateStoreHours(openHours) {
        let hoursText = "";
        let end = "";
        for (let slice in openHours) {
            if ('all-day' in openHours[slice] || (openHours[slice].end === '00:00' && openHours[slice].start === '00:00')) {
                return "24h/24";
            }
            end = openHours[slice].end;
            hoursText += `${openHours[slice].start}–${end}`;
            if (slice < openHours.length - 1) {
                hoursText += ", ";
            }
        }
        return hoursText;
    }

    function generateOpeningHoursHTML(weekly_opening) {
        const today = new Date().toLocaleString('en-us', {weekday: 'long'});
        let hoursData = {
            weekly_opening: [{dayName: "Monday", hoursDay: ""},
                {dayName: "Tuesday", hoursDay: ""},
                {dayName: "Wednesday", hoursDay: ""},
                {dayName: "Thursday", hoursDay: ""},
                {dayName: "Friday", hoursDay: ""},
                {dayName: "Saturday", hoursDay: ""},
                {dayName: "Sunday", hoursDay: ""}
            ]
        };
        for (let day in weekly_opening) {
            if (weekly_opening[day].length === 0) {
                hoursData.weekly_opening[day].hoursDay = "Closed"
            } else if (weekly_opening[day].hours) {
                if (hoursData.weekly_opening[day - 1].dayName === today) {
                    hoursData.weekly_opening[day - 1].current = true
                }
                if (weekly_opening[day].hours.length === 0) {
                    hoursData.weekly_opening[day - 1].hoursDay = "Closed"
                } else {
                    hoursData.weekly_opening[day - 1].hoursDay = concatenateStoreHours(weekly_opening[day].hours);
                }
            }
        }
        return hoursData.weekly_opening;
    }

    function getDirectionGoogleMapsUrl({address}) {
        const rootMapUrl = "https://maps.google.com?daddr=[Starbucks],";
        return rootMapUrl + `${address.lines[0]} ${address.city}`;
    }

    function getSummaryRenderedTemplate({properties}) {
        const templateRenderer = new woosmap.TemplateRenderer(summaryStoreTemplate);
        if (properties.storeDistanceApi) {
            properties.storeDistance = properties.storeDistanceApi;
        } else {
            properties.storeDistance = properties.distance ? getReadableDistance(properties.distance) : "";
        }
        properties.name = properties.name.capitalize();
        return templateRenderer.render(properties);
    }

    function getSelectedRenderedTemplate({properties}) {
        const templateRenderer = new woosmap.TemplateRenderer(selectedStoreTemplate);
        properties.name = properties.name.capitalize();
        let openingHours = "";
        if (properties.open && properties.open.open_now) {
            openingHours = properties.open.current_slice["all-day"] ? "24/24" : `${properties.open.current_slice.start}–${properties.open.current_slice.end}`;
        }
        properties.openlabel = (properties.open && properties.open.open_now) ? `Open now: ${openingHours}` : "";
        properties.week = properties.weekly_opening ? generateOpeningHoursHTML(properties.weekly_opening) : {};
        if (properties.tags.length > 0) {
            properties.services = properties.tags.map(value => (availableServices.filter(({serviceKey}) => serviceKey === value)[0])).filter(x => x);
            properties.hasServices = true;
        }
        properties.directionUrl = getDirectionGoogleMapsUrl(properties);
        return templateRenderer.render(properties);
    }

    function clearActiveFilters() {
        document.querySelectorAll('.filters-list li').forEach(el => {
            el.classList.remove('active-filter');
        });
        document.querySelector('#filters-btn').classList.remove('active');
        document.querySelector("#filters-btn .filter-label").textContent = "Filter";
        document.querySelector("#aroundme-btn .filter-label").textContent = "Geolocate";
        document.querySelector('#aroundme-btn').className = '';
        document.querySelector('#opennow-btn').className = '';
        filterByTags();
    }

    function buildFiltersView() {
        const templateRenderer = new woosmap.TemplateRenderer(filtersTagTemplate);
        document.querySelector('.filters-list').innerHTML = templateRenderer.render({availableServices});
        document.querySelectorAll('.filters-list li').forEach(filterEl => {
            filterEl.addEventListener("click", (e) => {
                filterEl.classList.toggle('active-filter');
                let filters = [];
                let filterLabel = ""
                document.querySelectorAll('.filters-list .active-filter').forEach(activeFilterEl => {
                    filters.push(activeFilterEl.dataset.servicename);
                });
                if (filters.length > 0) {
                    document.querySelector('#filters-btn').classList.add('active');
                    filterLabel = filters.join(", ");
                } else {
                    document.querySelector('#filters-btn').classList.remove('active');
                    filterLabel = "Filter";
                }
                document.querySelector("#filters-btn .filter-label").textContent = filterLabel;
                filterByTags();
            });
        });
    }

    function updateStoresWithDistanceAPI(stores, callback) {
        if (mapView.get('location') && stores && stores.length > 0) {
            let destinations = stores.map(({geometry}) => `${geometry.coordinates[1]},${geometry.coordinates[0]}`);

            fetch(`${distanceOptions.distanceapiUrl}
            origins=${mapView.get('location').lat},${mapView.get('location').lng}
            &destinations=${destinations.join("|")}
            &units=${distanceOptions.units}
            &mode=${distanceOptions.mode}
            &language=${distanceOptions.language}
            &elements=${distanceOptions.elements}
            &key=${distanceOptions.key}
            `)
                .then((response) => response.json())
                .then(function ({status, rows}) {
                    if (status === "OK") {
                        const distanceObj = rows[0].elements;
                        for (let i = 0; i < stores.length; i++) {
                            if (distanceObj[i].status !== "ZERO_RESULTS" && distanceObj[i].status !== "NOT_FOUND") {
                                stores[i].properties.storeDistanceApi = `${distanceObj[i].distance.text} (${distanceObj[i].duration.text})`;
                            }
                        }
                    }
                    callback(stores);
                });
        } else {
            callback(stores);
        }
    }

    function buildTableView(stores) {
        const listingStores = document.querySelector('#listing-stores-container');
        listingStores.innerHTML = '';
        if (stores.length > 0) {
            document.querySelector('#main').classList.add('stores-displayed')
        } else {
            document.querySelector('#main').classList.remove('stores-displayed');
        }
        for (let store in stores) {
            const cell = document.createElement('div');
            cell.innerHTML = getSummaryRenderedTemplate(stores[store]);
            cell.storeObj = stores[store];
            cell.addEventListener('click', () => {
                markerHover.setMap(null);
                const storeData = cell.storeObj;
                centerAndZoom(storeData);
                selectedStoreObj.set('selectedStore', storeData);
            });
            cell.addEventListener('mouseenter', () => {
                const storeData = cell.storeObj;
                setMarkerHover({lat: storeData.geometry.coordinates[1], lng: storeData.geometry.coordinates[0]});
            });
            cell.addEventListener('mouseleave', () => {
                markerHover.setMap(null);
            });
            listingStores.append(cell)
        }
        toggleAndSlideTableview();
    }

    function registerMapClickEvent() {
        selectedStoreObj.selectedStore_changed = function () {
            const selectedStore = this.get('selectedStore');
            if (!selectedStore) {
                currentStoreId = null;
            }
            if (selectedStore && selectedStore.properties.store_id !== currentStoreId) {
                currentStoreId = selectedStore.properties.store_id;
                const selectedStoreHTML = getSelectedRenderedTemplate(selectedStore, selectedStoreTemplate);
                centerAndZoom(selectedStore);
                toggleAndSlideTableview(selectedStoreHTML)
            }
        };
    }

    function getHTML5Position() {
        navigator.geolocation.getCurrentPosition(({coords}) => {
                search({
                    lat: coords.latitude,
                    lng: coords.longitude
                });
                document.querySelector('#aroundme-btn').className = '';
                document.querySelector('#aroundme-btn').classList.add('active');
            },
            error => {
                document.querySelector('#aroundme-btn').className = '';
            });
    }

    function geolocateUser() {
        fetch(`https://api.woosmap.com/geolocation/position/?key=${woosmapLoadOptions.publicKey}`)
            .then((response) => response.json())
            .then(function ({accuracy, latitude, longitude, city}) {
                if (accuracy > 200) {
                    getHTML5Position();
                } else {
                    search({lat: latitude, lng: longitude});
                    document.querySelector('#aroundme-btn').className = '';
                    document.querySelector('#aroundme-btn').classList.add('active');
                    if (city) {
                        document.querySelector('#aroundme-btn .filter-label').textContent = city;
                    }
                }
            })
            .catch((error) => {
                document.querySelector('#aroundme-btn').className = '';
            })
    }

    function search(location) {
        if (location) {
            clearMapSelectedStore();
            const searchParams = new woosmap.search.SearchParameters({
                lat: location.lat,
                lng: location.lng,
                query: searchQuery,
                page: 1,
                storesByPage: 15
            });
            dataSource.searchStoresByParameters(searchParams, stores => {
                mapView.set('location', location); //The 'location' need to be set before the 'stores'
                const openNow = document.querySelector('#opennow-btn').classList.contains('active');
                if (openNow) {
                    stores.features = stores.features.filter(({properties}) => properties.open && properties.open.open_now === openNow);
                }
                mapView.set('stores', stores.features);
                updateStoresWithDistanceAPI(stores.features, stores_updated => {
                    buildTableView(stores_updated);
                },)
            });
        }
    }

    function woosmap_main() {
        manageMobileView();
        const loader = new woosmap.MapsLoader(googleLoadOptions);
        loader.load(() => {
            map = new google.maps.Map(document.querySelector('#my-map'), googleMapsOptions);
            mapView = new woosmap.TiledView(map, woosmapOptions);
            mapView.enablePan(false);
            mapView.enableZoom(false);
            mapView.enablePaddedStoreCenter(true);
            mapView.marker.setOptions({
                icon: {url: 'https://www.woosmap.com/assets/locationanimation.svg'}
            });
            dataSource = new woosmap.DataSource();
            selectedStoreObj = new woosmap.utils.MVCObject();
            selectedStoreObj.selectedStore = null;
            registerMapClickEvent(mapView);
            selectedStoreObj.bindTo('selectedStore', mapView, 'selectedStore', false);
            currentWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            window.addEventListener('resize', debounce(() => {
                manageMobileView();
            }, 100, false))
            document.querySelector('#filters-btn').addEventListener('click', () => {
                document.querySelector('#filters-panel').className = '';
                document.querySelector('#filters-panel').classList.add('animated', 'fadeInDown');
            });
            document.querySelector('#close-btn').addEventListener('click', () => {
                document.querySelector('#filters-panel').classList.add('animated', 'fadeOutDown');
            });
            document.querySelector('#opennow-btn').addEventListener('click', () => {
                document.querySelector('#opennow-btn').classList.toggle('active');
                search(mapView.get('location'));
            });
            document.querySelector('#reset-btn').addEventListener('click', () => {
                buildTableView([]);
                clearMapSelectedStore();
                mapView.set('location', null);
                mapView.set('stores', null);
                clearActiveFilters();
            });
            document.querySelector('#aroundme-btn').addEventListener('click', () => {
                document.querySelector('#aroundme-btn').classList.toggle('loading');
                geolocateUser();
            });
            buildFiltersView();
            styleOnScroll();
            initSearchParam();
        });
        const localitiesWidget = new woosmap.localities.Autocomplete('search-input', localitiesOptions);
        localitiesWidget.addListener('selected_locality', () => {
            const locality = localitiesWidget.getSelectedLocality();
            document.querySelector('#aroundme-btn').className = '';
            document.querySelector('#aroundme-btn .filter-label').textContent = "Geolocate";
            search(locality.location);
        });
    }

    if (window.attachEvent) {
        window.attachEvent('onload', () => {
            WoosmapLoader.load(woosmapLoadOptions);
        });
    } else {
        window.addEventListener('load', WoosmapLoader.load(woosmapLoadOptions), false);
    }
})();
