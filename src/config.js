export const WORLD_SIZE = 30;
export const MAX_HEIGHT = 10;
export const SEA_LEVEL = 3;
export const BLOCK_SIZE = 1;
export const INTERACT_DISTANCE = 6.5;

export const CHUNK_SIZE = 10;
export const CHUNK_RADIUS = 2;

export const ITEM_TYPES = [
  { id: "grass", color: 0x5ea84a, symbol: "GR", placeable: true },
  { id: "dirt", color: 0x8a5a3b, symbol: "DI", placeable: true },
  { id: "stone", color: 0x8d95a3, symbol: "ST", placeable: true },
  { id: "wood", color: 0xb07b45, symbol: "WO", placeable: true },
  { id: "sand", color: 0xd8c57f, symbol: "SA", placeable: true },
  { id: "planks", color: 0xb9854e, symbol: "PL", placeable: true },
  { id: "cobble", color: 0x7d848f, symbol: "CO", placeable: true },
  { id: "glass", color: 0xa9dff7, symbol: "GL", placeable: true },
  { id: "brick", color: 0xaa4e3e, symbol: "BR", placeable: true },
  { id: "leaves", color: 0x3d8c42, symbol: "LE", placeable: true },
  { id: "torch", color: 0xf2c14e, symbol: "TO", placeable: true },
  { id: "water", color: 0x3d89d8, symbol: "WA", placeable: true },
  { id: "coal", color: 0x2c2f36, symbol: "CL", placeable: false },
  { id: "iron", color: 0xc0c7d2, symbol: "IR", placeable: false },
  { id: "gold", color: 0xe8be57, symbol: "GO", placeable: false },
  { id: "diamond", color: 0x57d8e8, symbol: "DM", placeable: false },
  { id: "apple", color: 0xd64e4e, symbol: "AP", placeable: false },
  { id: "bread", color: 0xd9a65f, symbol: "BD", placeable: false },
  { id: "sword", color: 0x9da6b2, symbol: "SW", placeable: false },
  { id: "pickaxe", color: 0x8aa0b8, symbol: "PK", placeable: false }
];

export const BLOCK_TYPES = ITEM_TYPES.filter((item) => item.placeable);
