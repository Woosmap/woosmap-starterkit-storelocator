(function () {
    const meterToYard = 1.09361;
    const unitSystem = 'metric'; // or 'imperial'
    const mobileBreakPoint = 900;
    let currentWidth = 0;

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
        key: "AIzaSyCOtRab6Lh2pNn7gYxvAqN5leETC24OXYQ",
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
        scrollwheel: false,
        mapTypeControl: false,
        fullscreenControl: false
    };
    const woosmapOptions = {
        gentleCenter: true,
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
            size: 10,
            minSize: 6
        },
        breakPoint: 12
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

    const selectedStoreTemplate = "<div class='woosmap-tableview-cell'>" +
        "<div class='store-photo-header'><img /><div id='back-to-results'></div></div>" +
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
        "<div class='store-photo'><img src='./images/default.svg'/></div></div>";

    const filtersTagTemplate = "<ul>" +
        "{{#availableServices}}<li data-servicekey='{{serviceKey}}' data-servicename='{{serviceName}}'><button>" +
        "<div class='icon-service icon-{{serviceKey}}'></div>" +
        "<div class='flex-grow'>{{serviceName}}</div>" +
        "<div class='active-icon-wrapper'>" +
        "</div></button></li>{{/availableServices}}" +
        "</ul>"

    let map, mapView, dataSource, selectedStoreObj, markerHover = null;
    let searchQuery = '';
    const photosSrcFull = ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg", "16.jpg", "17.jpg", "18.jpg", "19.jpg", "20.jpg", "21.jpg", "22.jpg", "23.jpg"];

    function debounce(func, wait, immediate) {
        let timeout;
        return function () {
            let context = this, args = arguments;
            const later = function () {
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
        return this.toLowerCase().replace(/(?:^|\s)\S/g, function (a) {
            return a.toUpperCase();
        });
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
            return Math.round(distance) + '\u00A0' + system.smallUnit;
        } else {
            return parseFloat((distance / system.factor).toFixed(1)) + '\u00A0' + system.unit;
        }
    }


    function manageMobileView() {
        if (currentWidth !== woosmap.$(window).width()) {
            if (woosmap.$(document).width() >= mobileBreakPoint) {
                if (!woosmap.$("#search-container").parent("#sidebar").length) {
                    woosmap.$("#sidebar").prepend(woosmap.$("#search-container"));
                    woosmap.$("#search-container").removeClass("mobile");
                }
            } else {
                if (!woosmap.$("#search-container").parent("#my-map-container").length) {
                    woosmap.$("#my-map-container").prepend(woosmap.$("#search-container"));
                    woosmap.$("#search-container").addClass("mobile");
                }
            }
            currentWidth = woosmap.$(window).width();
        }
    }

    function renderPhoto(cell, selector, photosSrc, rootPath) {
        woosmap.$(cell).find(selector + " img").each(function (index) {
            woosmap.$(this).attr("src", rootPath + photosSrc[Math.floor(Math.random() * photosSrc.length)]);
        });
    }

    function toggleAndSlideTableview(selectedStoreCell) {
        const $selectedStoreHTML = woosmap.$('#selected-store-container');
        const $listingStores = woosmap.$('#listing-stores-container');
        if (selectedStoreCell) {
            $selectedStoreCell = woosmap.$(selectedStoreCell).html();
            const $previousCell = $selectedStoreHTML.find(".woosmap-tableview-cell");
            if ($previousCell.length === 0) {
                $listingStores.removeClass('animated fadeOutLeft fadeInLeft').addClass('animated fadeOutLeft');
                $selectedStoreHTML.removeClass().addClass('animated fadeInRight');
            }
            woosmap.$('#search-container').addClass('selected-store');
            $selectedStoreHTML.show().html($selectedStoreCell);
            if ($listingStores.hasClass('home')) {
                woosmap.$('#back-to-results').html('Back to home');
            } else {
                woosmap.$('#back-to-results').html('Back to results');
            }
            woosmap.$('#back-to-results').click(function () {
                toggleAndSlideTableview();
                clearMapSelectedStore();
                setSearchBounds();
            });
            renderPhoto($selectedStoreHTML, '.store-photo-header', photosSrcFull, "./images/full/");
            $selectedStoreHTML.scrollTop(0);
        } else {
            $selectedStoreHTML.removeClass().addClass('animated fadeOutRight');
            $listingStores.removeClass().addClass('animated fadeInLeft');
            $listingStores.scrollTop(0);
            woosmap.$('#search-container').removeClass('selected-store');
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
        woosmap.$.each(woosmap.$('.filters-list .active-filter'), function (index, object) {
            fields.push(q.F('tag', woosmap.$(object).data('servicekey')));
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
            if ('all-day' in openHours[slice]) {
                return "24h/24";
            }
            end = openHours[slice].end;
            hoursText += openHours[slice].start + "–" + end;
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

    function getDirectionGoogleMapsUrl(store) {
        const rootMapUrl = "https://maps.google.com?daddr=[Starbucks],";
        return rootMapUrl + `${store.address.lines[0]} ${store.address.city}`;
    }

    function getSummaryRenderedTemplate(store) {
        const templateRenderer = new woosmap.TemplateRenderer(summaryStoreTemplate);
        store.properties.storeDistance = store.properties.distance ? getReadableDistance(store.properties.distance) : "";
        store.properties.name = store.properties.name.capitalize();
        return templateRenderer.render(store.properties);
    }

    function getSelectedRenderedTemplate(store) {
        const templateRenderer = new woosmap.TemplateRenderer(selectedStoreTemplate);
        store.properties.name = store.properties.name.capitalize();
        let openingHours = "";
        if (store.properties.open && store.properties.open.open_now) {
            openingHours = store.properties.open.current_slice["all-day"] ? "24/24" : store.properties.open.current_slice.start + "–" + store.properties.open.current_slice.end;
        }
        store.properties.openlabel = (store.properties.open && store.properties.open.open_now) ? "Open now: " + openingHours : "";
        store.properties.week = store.properties.weekly_opening ? generateOpeningHoursHTML(store.properties.weekly_opening) : {};
        if (store.properties.tags.length > 0) {
            store.properties.services = store.properties.tags.map(value => (availableServices.filter(serviceObj => {
                return serviceObj.serviceKey === value
            })[0])).filter(x => x);
            store.properties.hasServices = true;
        }
        store.properties.directionUrl = getDirectionGoogleMapsUrl(store.properties);
        return templateRenderer.render(store.properties);
    }

    function buildFiltersView() {
        const templateRenderer = new woosmap.TemplateRenderer(filtersTagTemplate);
        woosmap.$('.filters-list').append(templateRenderer.render({availableServices: availableServices}));
        woosmap.$('.filters-list li').click(function () {
            woosmap.$(this).toggleClass('active-filter');
            let filters = [];
            let filterLabel = ""
            woosmap.$.each(woosmap.$('.filters-list .active-filter'), function (index, object) {
                filters.push(woosmap.$(object).data('servicename'))
            });
            if (filters.length > 0) {
                woosmap.$('#filters-btn').addClass('active');
                filterLabel = filters.join(", ");
            } else {
                woosmap.$('#filters-btn').removeClass('active');
                filterLabel = "Filter";
            }
            woosmap.$("#filters-btn .filter-label").text(filterLabel);
            filterByTags();
        });
    }

    function buildTableView(stores) {
        const $listingStores = woosmap.$('#listing-stores-container');
        $listingStores.empty();
        stores.length > 0 ? woosmap.$('#main').addClass('stores-displayed') : woosmap.$('#main').removeClass('stores-displayed');
        for (store in stores) {
            const $cell = woosmap.$(document.createElement('div'));
            $cell.append(getSummaryRenderedTemplate(stores[store]));
            $cell.data('store', stores[store]);
            $cell.click(function () {
                const storeData = woosmap.$(this).data('store');
                selectedStoreObj.set('selectedStore', storeData);
                const selectedStoreHTML = getSelectedRenderedTemplate(storeData);
                toggleAndSlideTableview(selectedStoreHTML);
            });
            $cell.mouseenter(function () {
                const storeData = woosmap.$(this).data('store');
                setMarkerHover({lat: storeData.geometry.coordinates[1], lng: storeData.geometry.coordinates[0]});
            });
            $cell.mouseleave(function () {
                markerHover.setMap(null);
            });
            $listingStores.append($cell)
        }
        toggleAndSlideTableview();
    }

    function registerMapClickEvent(mapView) {
        let storeObj = new woosmap.utils.MVCObject();
        storeObj.selectedStore_changed = function () {
            const selectedStore = this.get('selectedStore');
            if (selectedStore) {
                const selectedStoreHTML = getSelectedRenderedTemplate(selectedStore, selectedStoreTemplate);
                toggleAndSlideTableview(selectedStoreHTML)
            }
        };
        storeObj.bindTo('selectedStore', mapView, false);
    }

    function search(location) {
        if (location) {
            const searchParams = new woosmap.search.SearchParameters({
                lat: location.lat,
                lng: location.lng,
                query: searchQuery,
                page: 1,
                storesByPage: 15
            });
            dataSource.searchStoresByParameters(searchParams, function (stores) {
                mapView.set('location', location); //The 'location' need to be set before the 'stores'
                const openNow = woosmap.$('#opennow-btn').hasClass('active');
                if (openNow) {
                    stores.features = stores.features.filter(function (store) {
                        return (store.properties.open && store.properties.open.open_now === openNow);
                    });
                }
                mapView.set('stores', stores.features);
                buildTableView(stores.features);
            });
        }
    }

    function woosmap_main() {
        manageMobileView();
        const loader = new woosmap.MapsLoader(googleLoadOptions);
        loader.load(function () {
            map = new google.maps.Map(woosmap.$('#my-map')[0], googleMapsOptions);
            mapView = new woosmap.TiledView(map, woosmapOptions);
            mapView.marker.setOptions({
                icon: {url: 'https://www.woosmap.com/assets/locationanimation.svg'}
            });
            dataSource = new woosmap.DataSource();
            registerMapClickEvent(mapView);
            selectedStoreObj = new woosmap.utils.MVCObject();
            selectedStoreObj.selectedStore = null;
            selectedStoreObj.bindTo('selectedStore', mapView, 'selectedStore', false);
            currentWidth = woosmap.$(window).width();
            woosmap.$(window).resize(debounce(() => {
                manageMobileView();
            }, 150, false));
            woosmap.$('#filters-btn').click(function () {
                woosmap.$('#filters-panel').removeClass().addClass('animated fadeInDown');
            });
            woosmap.$('#close-btn').click(function () {
                woosmap.$('#filters-panel').addClass('animated fadeOutDown');
            });
            woosmap.$('#opennow-btn').click(function () {
                woosmap.$('#opennow-btn').toggleClass('active');
                search(mapView.get('location'));
            });
            woosmap.$('#reset-btn').click(function () {
                buildTableView([]);
                clearMapSelectedStore();
                mapView.set('location', null);
                mapView.set('stores', null);
            });
            buildFiltersView();
        });
        let localitiesWidget = new woosmap.localities.Autocomplete('search-input', localitiesOptions);
        localitiesWidget.addListener('selected_locality', () => {
            let locality = localitiesWidget.getSelectedLocality();
            search(locality.location);
        });
    }

    if (window.attachEvent) {
        window.attachEvent('onload', function () {
            WoosmapLoader.load(woosmapLoadOptions);
        });
    } else {
        window.addEventListener('load', WoosmapLoader.load(woosmapLoadOptions), false);
    }
}());
