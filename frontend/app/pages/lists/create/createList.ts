import {Page, NavController, Platform, Alert, NavParams} from 'ionic-angular';
import {ListService, List} from '../../../services/listService';
import {Lists} from '../lists';
import {ModalConfirm} from './modalConfirm/modalConfirm';
import {Reminders} from '../../reminders/reminders';
import {CreateReminder} from '../../reminders/create/createReminder';
import {EditReminder} from '../../reminders/edit/editReminder';
import {Geolocation} from 'ionic-native';

declare var google: any;

@Page({
    templateUrl: 'build/pages/lists/create/createList.html',
    providers: [Geolocation]
})
export class CreateList {
    map: any;
    markers: any = [];
    search: any = "";

    constructor(
        private platform: Platform,
        private nav: NavController,
        private listService: ListService,
        private geolocation: Geolocation,
        private navParams: NavParams) {
        this.platform.ready().then(() => {
            this.loadMap();
        });
    }

    loadMap() {
        Geolocation.getCurrentPosition().then(
            (position) => {
                let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                let mapOptions = {
                    center: latLng,
                    zoom: 15,
                    mapTypeControl: false,
                    disableDefaultUI: true,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                }
                this.map = new google.maps.Map(document.getElementById("map"), mapOptions);
                this.map.addListener('click', this.addClickLocation);
                this.markers = [];
                this.addMarker(latLng, "My location", false);
            },
            (error) => {
                console.error(error);
                let alert = Alert.create({
                    title: 'Something went wrong',
                    subTitle: 'We couldn\'t get your location, maybe location services are off?',
                    buttons: [
                        {
                            text: 'OK',
                            handler: () => {
                                this.nav.setRoot(Lists);
                            }
                        }
                    ]
                });
                this.nav.present(alert);
            });
    }

    addMarker = (position, name: string, removable: boolean) => {
        let marker = new google.maps.Marker({
            map: this.map,
            title: name,
            animation: google.maps.Animation.DROP,
            position: position
        });
        if (removable) {
            marker.radius = 50;
            let circle = new google.maps.Circle({
                map: this.map,
                center: position,
                radius: 50,
                editable: true
            });
            circle.addListener('radius_changed', () => {
                marker.radius = circle.getRadius();
            });
            marker.addListener('click', () => {
                marker.setMap(null);
                circle.setMap(null);
                this.markers = this.markers.filter((marker) => {
                    return marker.map != null;
                });
            });
            this.markers.push(marker);
        }
    }

    addClickLocation = (event) => {
        this.addMarker(event.latLng, "Custom location", true);
    }

    clearAllMarkers = () => {
        this.markers.forEach((marker) => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    onInput(searchBox) {
        let query = searchBox.value.trim();
        if (query == "") {
            this.clearAllMarkers();
        } else {
            var request = {
                bounds: this.map.getBounds(),
                keyword: query
            };

            let service = new google.maps.places.PlacesService(this.map);
            service.nearbySearch(request, this.searchResults);
        }
    }

    searchResults = (results, status) => {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            this.clearAllMarkers();
            for (var i = 0; i < results.length; i++) {
                this.addMarker(results[i].geometry.location, results[i].name, true);
            }
        } else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            let alert = Alert.create({
                title: 'Nothing found',
                subTitle: 'There are no search results, please make your search query less specific.',
                buttons: ['OK']
            });
            this.clearAllMarkers();
            this.search = "";
            this.nav.present(alert);
        }
    }

    parseMarkers() {
        let locations = [];
        this.markers.forEach((marker) => {
            locations.push({
                name: marker.title,
                latitude: marker.position.lat(),
                longitude: marker.position.lng(),
                radius: Math.round(marker.radius)
            });
        })
        return locations;
    }

    save() {
        if (this.platform.is("ios")) {
            let locations = this.parseMarkers();
            this.nav.push(ModalConfirm, {
                locations: locations,
                form: this.navParams.get("form"),
                createReminder: this.navParams.get("createReminder")
            });
        } else {
            this.alertSave();
        }
    }

    alertSave() {
        let alert = Alert.create({
            title: 'Name',
            inputs: [
                {
                    name: 'name',
                    placeholder: 'Name'
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Save',
                    handler: data => {
                        if (data.name.trim().length != 0) {
                            let locations = this.parseMarkers();
                            let list: List = {
                                name: data.name,
                                locations: locations,
                                favourite: 0
                            };
                            this.listService.add(list).then((res) => {
                                if (this.navParams.get("createReminder") || this.navParams.get("editReminder")) {
                                    this.listService.get(res.res.insertId).then((l) => {
                                        this.nav.setRoot(Reminders);
                                        let page;
                                        if (this.navParams.get("createReminder")) {
                                            page = CreateReminder;
                                        } else {
                                            page = EditReminder;
                                        }
                                        let form = this.navParams.get("form");
                                        form.list = l[0];
                                        this.nav.push(page, {
                                            form: form
                                        });
                                    });
                                } else {
                                    this.nav.setRoot(Lists);
                                }
                            });
                        }
                    }
                }
            ]
        });
        this.nav.present(alert);
    }
}
