//app/types/romLote.type.ts

import { RomType } from './rom.type';

export type RomLoteType = {
  traduzido: boolean;
  type: RomType;
  name: string;
  description: string;
  capaUrl: string;
};
