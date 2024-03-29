import {DbService} from './dbService';
import {Injectable} from 'angular2/core';

export interface Location {
    list: number,
    latitude: number,
    longitude: number,
    radius: number,
    name: string
}

@Injectable()
export class LocationService {

    constructor(private dbService: DbService) { }

    add(location) {
        var query =
            "INSERT INTO locations (list, latitude, longitude, name, radius) VALUES (?,?,?,?,?)";
        var params = [location.list, location.latitude, location.longitude, location.name, location.radius];
        return this.dbService.exec(query, params).then(
            (res) => { },
            this.err
        );
    }

    batchAdd(locations: Array<Location>, listId: number) {
        let promises = [];
        locations.forEach((location) => {
            location.list = listId;
            promises.push(this.add(location).then(() => { }, this.err));
        });
        return Promise.all(promises);
    }

    delByList(id: number) {
        let query = "DELETE FROM locations WHERE list = (?)";
        let params = [id];
        return this.dbService.exec(query, params).then(() => {

        }, this.err);
    }

    get(id: number) {
        let query = "";
        if (id != -1) {
            query = "SELECT * FROM locations WHERE list = " + id;
        } else {
            query = "SELECT * FROM locations";
        }
        return this.dbService.exec(query, []).then(this.getResults, this.err);
    }

    getReminder(id: number) {
        return this.get(id).then((location: any) => {
            let query = "SELECT * FROM reminders WHERE list = (?) AND active = 1";
            console.log(location);
            let params = [location[0].list];
            return this.dbService.exec(query, params).then(this.getResults, this.err);
        });
    }

    getByList(id) {
        let query = "SELECT * FROM locations WHERE list = " + id;
        return this.dbService.exec(query, []).then(this.getResults, this.err);
    }

    getActive() {
        let query = "SELECT * FROM reminders JOIN locations ON locations.list = reminders.list WHERE active = 1";
        return this.dbService.exec(query, []).then(this.getResults, this.err);
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
