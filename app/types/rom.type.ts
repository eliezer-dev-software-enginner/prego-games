//app/types/rom.type.ts

export type Rom = {
  id: string;
  titulo: string;
  descricao: string;
  pathRef: string;
  capaRef: string;
  preco: number;
  type: RomType;
  vendas: number;
  dtMillis: number;
  traduzido: boolean;
  dublado: boolean;
};

export type RomType = 'PS2' | 'SNES' | 'GBA';
