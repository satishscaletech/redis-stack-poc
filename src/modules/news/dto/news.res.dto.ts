import { tagResponseDto } from './tag.res.dto';

export class newsResponseDto {
  id: string;
  datum: string;
  datum_lang_f: string;
  datum_f: string;
  source_code: string;
  grusel: string;
  bild: string;
  bild_info: string;
  titel: string;
  inhalt: string;
  gemerkte: number;
  disallowed: number;
  tags: tagResponseDto;
  constructor(data: any) {
    this.id = data.id;
    this.datum = data.datum;
    this.datum_lang_f = data.datum_lang_f;
    this.datum_f = data.datum_f;
    this.source_code = data.source_code;
    this.grusel = data.grusel;
    this.bild = data.bild;
    this.bild_info = data.bild_info;
    this.titel = data.titel;
    this.inhalt = data.inhalt;
    this.gemerkte = data.gemerkte;
    this.disallowed = data.disallowed;
    if (data.tags) {
      this.tags = data.tags.map((o) => {
        return new tagResponseDto(o);
      });
    }
  }
}
