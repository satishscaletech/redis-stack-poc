import { Injectable } from '@nestjs/common';
import * as fs from 'fs'
import { exec } from 'child_process';
@Injectable()
export class ImportDataService {
    public async importNews() {
        console.log("importing News")
        try {
            if (fs.existsSync('dist/data/news.json')) {
                fs.unlinkSync('dist/data/news.json');

            }
            if (fs.existsSync('dist/data/news.json.gz')) {
                fs.unlinkSync('dist/data/news.json.gz')
            }
            var script = exec("sh src/data/export-news-json.sh", (error, stdout, stderr) => {
                console.log("stdout=====>", stdout);
                console.log("stderr======", stderr)
                if (!stderr) {
                    exec("gzip -k src/data/news.json")
                }
            });
        } catch (error) {
            console.log("error while import News Data ============>", error);
        }
    }

    public async importKategorien() {
        console.log("importing Kategorie")
        try {
            if (fs.existsSync('dist/data/kategorien.json')) {
                fs.unlinkSync('dist/data/kategorien.json');

            }
            if (fs.existsSync('dist/data/kategorien.json.gz')) {
                fs.unlinkSync('dist/data/kategorien.json.gz')
            }
            var script = exec("sh src/data/export-kategorien-json.sh", (error, stdout, stderr) => {
                console.log("stdout=====>", stdout);
                console.log("stderr======", stderr);
                if (!stderr) {
                    exec("gzip -k src/data/kategorien.json")
                }
            });
        } catch (error) {
            console.log("error while import category Data ============>", error);
        }
    }

    public async importGroups() {
        console.log("importing Groups")
        try {
            if (fs.existsSync('dist/data/group.json')) {
                fs.unlinkSync('dist/data/group.json');


            }
            if (fs.existsSync('dist/data/group.json.gz')) {
                fs.unlinkSync('dist/data/group.json.gz');
            }
            var script = exec("sh src/data/export-gruppen-json.sh", (error, stdout, stderr) => {
                console.log("stdout=====>", stdout);
                console.log("stderr======", stderr)
                if (!stderr) {
                    exec("gzip -k src/data/group.json")
                }
            });
        } catch (error) {
            console.log("error while import group Data ============>", error);
        }
    }
}


