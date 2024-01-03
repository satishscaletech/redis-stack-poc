import { parentGroup } from './parentGroup.dto.res';

export class tagResponseDto {
  kategorie_id: number;
  kategorie: string;
  kategorie_eng: string;
  gruppen_id: number;
  gruppe: string;
  gruppe_eng: string;
  parentGroup: parentGroup;
  constructor(data: any) {
    this.kategorie_id = data.kategorie_id;
    this.kategorie = data.kategorie;
    this.kategorie_eng = data.kategorie_eng;
    this.gruppen_id = data.gruppen_id;
    this.gruppe = data.gruppe;
    this.gruppe_eng = data.gruppe_eng;
    if (data.parentGroup) {
      this.parentGroup = data.parentGroup.map((o) => {
        return new parentGroup(o);
      });
    }
  }
}
