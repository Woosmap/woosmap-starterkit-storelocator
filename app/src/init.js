(function () {
    const meterToYard = 1.09361;
    const unitSystem = 'metric'; // or 'imperial'
    const mobileBreakPoint = 900;
    let currentWidth = 0;

    const woosmapLoadOptions = {
        version: '1.4',
        publicKey: 'starbucks-demo-woos', //replace with your public key
        callback: woosmap_main,
        loadJQuery: true
    };
    const localitiesOptions = {
        components: {
            //"country": ["gb"]
        },
        //language: "GB"
    };
    const googleLoadOptions = {
        key: "",
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
                    url: './images/markers/numbered/{number}.svg',
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
        breakPoint: 10
    };
    const servicesLabel = {
        "wheelchair_access": "Wheelchair Access",
        "in-store_wi-fi": "Wi-Fi",
        "parking": "Parking",
        "schedule_a_demo": "Demo",
        "reserve_and_collect": "Reserve & Collect",
        "delivery_and_installation_service": "Delivery & Installation",
        "customised_solutions": "Customised Solutions",
        "financing": "Financing",
        "repair_service": "Repair Service",
    };
    const typesLabel = {
    };
    const selectedStoreTemplate = "<div class='woosmap-tableview-cell'>" +
        "<div class='store-photo-header'><img /><div id='back-to-results'></div></div>" +
        "<div class='selected-store-card'><div class='hero'>" +
        "<div class='store-title'>{{name}}</div>" +
        "{{#types}}<div class='store-types'>{{types}}</div>{{/types}}" +
        "{{#openlabel}}<div class='store-opened'>{{openlabel}}</div>{{/openlabel}}</div>" +
        "<div class='content'><div class='store-address'>{{address.lines}} {{address.city}} {{address.zipcode}}</div>" +
        "{{#contact.phone}}<div class='store-contact'><a href='tel:{{contact.phone}}'>{{contact.phone}}</a></div>{{/contact.phone}}" +
        "<div class='store-direction-url'><a href='{{directionUrl}}' target='_blank'>Get Direction</a></div>" +
        "</div></div>" +
        "{{#open}}<div class='store-properties-list'><div class='store-properties-header'>Opening hours</div>" +
        "<ul class='store-opening-hours-list'>" +
        "{{#week}}<li><span class='day'>{{dayName}}</span><span class='hours'>{{hoursDay}}</span></li>{{/week}}" +
        "</ul></div>{{/open}}" +
        "{{#hasServices}}<div class='store-properties-list'><div class='store-properties-header'>Amenitites</div>" +
        "<ul class='store-services-list'>" +
        "{{#services}}<li><span class='{{service}}'>{{serviceLabel}}</span></li>{{/services}}" +
        "</ul></div>{{/hasServices}}" +
        "</div>";

    const summaryStoreTemplate = "<div class='controls summary-store-card'><div>" +
        "<div><strong>{{name}} - {{address.city}}</strong></div>" +
        "<div><div class='store-address'>{{address.lines}} {{address.city}} {{address.zipcode}}</div>" +
        "{{#contact.phone}}<div  class='store-contact'><a href='tel:{{contact.phone}}'>{{contact.phone}}</a></div>{{/contact.phone}}" +
        "<div class='store-distance'>{{storeDistance}}</div>" +
        "</div></div>" +
        "<div class='store-photo'><img src='./images/default.svg'/></div></div>";


    let map, mapView, dataSource, selectedStoreObj = null;
    const photosSrcFull = ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg", "16.jpg", "17.jpg", "18.jpg", "19.jpg", "20.jpg", "21.jpg", "22.jpg", "23.jpg"];

    function debounce(func, wait, immediate) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

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
                }
            } else {
                if (!woosmap.$("#search-container").parent("#my-map-container").length) {
                    woosmap.$("#my-map-container").prepend(woosmap.$("#search-container"));
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

    function clearMapSelectedStore() {
        mapView.set('selectedStore', null);
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
            woosmap.$('#search-input').addClass('selected-store');
            $selectedStoreHTML.show().html($selectedStoreCell);
            if ($listingStores.hasClass('home')) {
                woosmap.$('#back-to-results').html('Back to home');
            } else {
                woosmap.$('#back-to-results').html('Back to results');
            }
            woosmap.$('#back-to-results').click(function () {
                toggleAndSlideTableview();
                clearMapSelectedStore();
            });
            renderPhoto($selectedStoreHTML, '.store-photo-header', photosSrcFull, "./images/full/");
            $selectedStoreHTML.scrollTop(0);
        } else {
            $selectedStoreHTML.removeClass().addClass('animated fadeOutRight');
            $listingStores.removeClass().addClass('animated fadeInLeft');
            $listingStores.scrollTop(0);
            woosmap.$('#search-input').removeClass('selected-store');
        }
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
                if (weekly_opening[day].hours.length === 0) {
                    hoursData.weekly_opening[day - 1].hoursDay = "Closed"
                } else {
                    hoursData.weekly_opening[day - 1].hoursDay = concatenateStoreHours(weekly_opening[day].hours);
                }
            }
        }
        return hoursData.weekly_opening;
    }

    function formatTagsAsArrayObjects(store) {
        let services = [];
        for (let i = 0; i < store.properties.tags.length; ++i) {
            services[i] = {
                service: store.properties.tags[i]
            };
        }
        return services
    }

    function getDirectionGoogleMapsUrl(store) {
        const rootMapUrl = "https://maps.google.com?daddr=[Starbucks],";
        return rootMapUrl + `${store.address.lines[0]} ${store.address.city}`;
    }

    function getSummaryRenderedTemplate(store) {
        const templateRenderer = new woosmap.TemplateRenderer(summaryStoreTemplate);
        store.properties.storeDistance = store.properties.distance ? getReadableDistance(store.properties.distance) : "";
        return templateRenderer.render(store.properties);
    }

    function getSelectedRenderedTemplate(store) {
        const templateRenderer = new woosmap.TemplateRenderer(selectedStoreTemplate);
        store.properties.openlabel = (store.properties.open && store.properties.open.open_now) ? "Open now" : "Closed";
        store.properties.week = store.properties.weekly_opening ? generateOpeningHoursHTML(store.properties.weekly_opening) : {};
        if (store.properties.tags.length > 0) {
            store.properties.services = store.properties.tags.map(value => ({
                'service': value,
                'serviceLabel': servicesLabel[value] ? servicesLabel[value] : value
            }));
            store.properties.hasServices = true;
        }
        store.properties.directionUrl = getDirectionGoogleMapsUrl(store.properties);
        return templateRenderer.render(store.properties);
    }

    function buildTableView(stores) {
        const $listingStores = woosmap.$('#listing-stores-container');
        $listingStores.empty();
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
            $listingStores.append($cell)
        }
        toggleAndSlideTableview();
    }

    function registerMapClickEvent(mapView) {
        let storeObj = new woosmap.utils.MVCObject();
        storeObj.selectedStore_changed = function () {
            var selectedStore = this.get('selectedStore');
            if (selectedStore) {
                const selectedStoreHTML = getSelectedRenderedTemplate(selectedStore, selectedStoreTemplate);
                toggleAndSlideTableview(selectedStoreHTML)
            }
        };
        storeObj.bindTo('selectedStore', mapView, false);
    }

    function search(location) {
        if (location) {
            var searchParams = new woosmap.search.SearchParameters({
                lat: location.lat,
                lng: location.lng,
                page: 1,
                storesByPage: 9
            });
            dataSource.searchStoresByParameters(searchParams, function (stores) {
                mapView.set('location', location); //The 'location' need to be set before the 'stores'
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
