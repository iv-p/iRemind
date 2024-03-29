import {DbService} from './dbService';
import {LocationService} from './locationService';
import {Injectable} from 'angular2/core';
import {Location} from './locationService';
import {GeofenceService} from './geofenceService';
import {Toast} from 'ionic-native';

export interface List {
    name: string,
    locations: Array<Location>,
    favourite: number
}

@Injectable()
export class ListService {
    constructor(
        private dbService: DbService,
        private locationService: LocationService,
        private geofenceService: GeofenceService) { }

    add(list: List) {
        var query = "INSERT INTO lists (name, favourite) VALUES (?,?)";
        var params = [list.name, list.favourite];
        return this.dbService.exec(query, params).then((res) => {
            this.locationService.batchAdd(list.locations, res.res.insertId);
            return res;
        }, this.err);
    }

    edit(id: number, list: any) {
        console.log(list, id);
        let query = "UPDATE lists SET name = (?) WHERE id = (?)";
        let params = [list.name, id];
        return this.dbService.exec(query, params).then(() => {
            query = "DELETE FROM locations WHERE list = (?)";
            params = [id];
            return this.dbService.exec(query, params).then((res) => {
                return this.locationService.batchAdd(list.locations, id).then(() => {
                    this.geofenceService.sync();
                });
            }, this.err);
        }, this.err);
    }

    setFavourite(id: number, favourite: number) {
        let query = "UPDATE lists SET favourite = (?) WHERE id = (?)";
        let params = [favourite, id];
        this.dbService.exec(query, params).then(
            (res) => { },
            this.err);
    }

    getFavourites() {
        let query = "SELECT * FROM lists WHERE favourite = (?)";
        let params = [1]
        return this.dbService.exec(query, params).then(this.getResults, this.err);
    }

    del(id: number) {
        let query = "SELECT * FROM reminders WHERE list = (?)";
        let params = [id];
        return this.dbService.exec(query, params).then((res) => {
            if (res.res.rows.length == 0) {
                var query = "DELETE FROM lists WHERE id = ?";
                let params = [id];
                return this.dbService.exec(query, params).then((succ) => {
                    return this.locationService.delByList(id).then(
                        () => { this.geofenceService.sync(); }
                    );
                }, this.err);
            } else {
                Toast.showLongBottom("Can't delete list - there is an active reminder using it");
            }
        }, this.err);
    }

    getAll() {
        let query = "SELECT * FROM lists";
        return this.dbService.exec(query, []).then(this.getResults, this.err);
    }

    get(id: number) {
        let query = "SELECT * FROM lists WHERE id = (?)";
        let params = [id];
        return this.dbService.exec(query, params).then(this.getResults, this.err);
    }


    getResults = (response) => {
        var data = [];
        for (var i = 0; i < response.res.rows.length; i++) {
            data.push(response.res.rows.item(i));
        }
        return data;
    }

    err(err) {
        console.error(err);
    }
}
