export class parentGroup {
  gruppen_id: number;
  eltern_id: number;
  gruppe: string;
  gruppe_eng: string;

  constructor(data: any) {
    this.gruppen_id = data.gruppen_id;
    this.eltern_id = data.eltern_id;
    this.gruppe = data.gruppe;
    this.gruppe_eng = data.gruppe_eng;
  }
}
