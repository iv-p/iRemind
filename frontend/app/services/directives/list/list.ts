import {Component, Input} from 'angular2/core';
import {NavController} from 'ionic-angular';
import {ListService} from '../../listService';
import {LocationService} from '../../locationService';
import {CreateList} from '../../../pages/lists/create/createList';
import {CreateReminder} from '../../../pages/reminders/create/createReminder';
import {EditList} from '../../../pages/lists/edit/editList';
import {MaxLengthPipe} from '../../pipes/maxLength.pipe';
import {MapDirective} from '../map/map';
import {IONIC_DIRECTIVES} from 'ionic-angular/config/directives';

@Component({
    selector: '[ir-list]',
    templateUrl: 'build/services/directives/list/list.html',
    pipes: [MaxLengthPipe],
    directives: [IONIC_DIRECTIVES, MapDirective]
})
export class ListDirective {

    @Input('ir-list') list: any;

    constructor(
        private nav: NavController,
        private locationService: LocationService,
        private listService: ListService) { }

    toggleFavourite() {
        this.list.favouriteb = !this.list.favouriteb;
        this.listService.setFavourite(this.list.id, this.list.favouriteb ? 1 : 0);
    }

    edit() {
        this.locationService.getByList(this.list.id).then((locations) => {
            this.list.locations = locations;
            this.nav.push(EditList, { list: this.list });
        });
    }

    showMap() {
        this.locationService.getByList(this.list.id).then((locations) => {
            this.list.locations = locations;
            this.list.showMap = !this.list.showMap;
        });
    }

    createReminder() {
        let form = {
            name: "",
            note: "",
            list: this.list,
            radius: 50,
            volume: 50
        }
        this.nav.push(CreateReminder, { form: form });
    }
}
