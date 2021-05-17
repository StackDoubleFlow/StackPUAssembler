const nbt = require("./nbt");
const fs = require("fs");
const zlib = require("zlib");

const file = fs.readFileSync("./programs/bubble.S", { encoding: "utf8" });
const lines = file.split("\n");
const opcodes = {
    "NOP": 0b00000,
    "ADD": 0b00001,
    "SUB": 0b00010,
    "XOR": 0b00011,
    "AND": 0b00100,
    "IOR": 0b00101,
    "INC": 0b00110,
    "RSH": 0b00111,
    "DEC": 0b01000,
    "CLR": 0b01001,
    "RST": 0b01010,
    "RLD": 0b01011,
    "JMP": 0b01100,
    "PST": 0b01101,
    "MLD": 0b01110,
    "MST": 0b01111,
    "PLD": 0b10000,
};
let bytes = [];
let i = 0;
for (const line of lines) {
    const words = line.split(" ");
    let opcode = opcodes[words[0]];
    let operand = 1;
    if (words[1]) {
        operand = parseInt(words[1].replace("$", ""));
    }
    let byte = (opcode << 3) | operand;
    if (opcode == undefined) {
        byte = parseInt(words[0]);
    }
    bytes.push(byte);
    console.log(i, byte.toString(2).padStart(8, "0"));
    i++;
}

const blocks = new Array(64 * 16).fill(0);
i = 0;
for (const byte of bytes) {
    const x = 2 * i;
    for (let j = 0; j < 8; j++) {
        const y = 2 * j;
        const bit = ((byte & (1 << j)) >> j) & 1;
        blocks[y * 64 + x] = bit;
    }
    i++;
} 

const nbtBuffer = nbt.writeNBT({
    Schematic: {
        type: "compound",
        val: {
            Width: { type: "short", val: 64 },
            Height: { type: "short", val: 16 },
            Length: { type: "short", val: 1 },
            Palette: {
                type: "compound",
                val: {
                    "minecraft:air": { type: "int", val: 0 },
                    "minecraft:redstone_block": { type: "int", val: 1 },
                }
            },
            Metadata: {
                type: "compound",
                val: {
                    WEOffsetX: { type: "int", val: 1 },
                    WEOffsetY: { type: "int", val: -17 },
                    WEOffsetZ: { type: "int", val: 0 },
                }
            },
            PaletteMax: { type: "int", val: 2 },
            BlockData: {
                type: "byteArray",
                val: blocks
            },
            DataVersion: { type: "int", val: 2567 },
            Version: { type: "int", val: 2 },
            BlockEntities: { 
                type: "list", 
                val: {
                    type: "compound",
                    val: [],
                }
            },
            Offset: {
                type: "intArray",
                val: [0, 0, 0]
            }
        }
    }
});

const compressed = zlib.gzipSync(nbtBuffer);
fs.writeFileSync("./program.schem", compressed);