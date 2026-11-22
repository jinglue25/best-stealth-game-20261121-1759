// Every compound is laid out by hand. Bushes conceal; solid cover blocks sight.
const rect = (x, y, w, h) => ({ x, y, w, h });
const guard = (points, speed = 58, pause = 1.8, angle = 0) => ({
  points: points.map(([x, y]) => ({ x, y })), speed, pause, angle,
});
export const LEVELS = [
  {
    name: 'Rooftop Garden', district: '01 / THE UPPER CITY',
    briefing: 'Keep to the planters. Lift the garden manifests, then find the east stairwell.',
    start: { x: 92, y: 594 }, exit: rect(1175, 168, 64, 98), required: 2, pebbles: 3,
    walls: [rect(24, 112, 1232, 18), rect(24, 656, 1232, 18), rect(24, 130, 18, 526), rect(1238, 130, 18, 526), rect(740, 310, 26, 210), rect(420, 192, 210, 26)],
    crates: [rect(310, 420, 108, 82), rect(210, 246, 104, 80), rect(848, 480, 100, 78), rect(958, 230, 104, 72)],
    bushes: [rect(64, 536, 162, 96), rect(222, 432, 87, 111), rect(430, 560, 260, 62), rect(788, 150, 133, 81), rect(1090, 420, 120, 135)],
    lamps: [{ x: 588, y: 370, r: 137 }, { x: 1090, y: 324, r: 132 }],
    guards: [guard([[480, 470], [480, 282], [674, 282], [674, 470]], 68, 2.3, Math.PI), guard([[850, 360], [1110, 360], [1110, 582], [790, 582]], 60, 1.8, 0)],
    intel: [{ x: 155, y: 562 }, { x: 486, y: 162 }, { x: 1118, y: 598 }],
  },
  {
    name: 'Warehouse Row', district: '02 / THE FREIGHT QUARTER',
    briefing: 'Four shipping keys. The lamps expose movement; a pebble can turn a patrol.',
    start: { x: 88, y: 602 }, exit: rect(1172, 566, 66, 72), required: 3, pebbles: 3,
    walls: [rect(24, 112, 1232, 18), rect(24, 656, 1232, 18), rect(24, 130, 18, 526), rect(1238, 130, 18, 526), rect(330, 224, 34, 278), rect(662, 130, 32, 228), rect(870, 420, 34, 236)],
    crates: [rect(170, 380, 88, 100), rect(440, 440, 126, 70), rect(474, 210, 98, 72), rect(755, 478, 66, 91), rect(994, 244, 130, 90)],
    bushes: [rect(62, 524, 139, 110), rect(230, 143, 88, 88), rect(380, 539, 160, 91), rect(704, 167, 113, 105), rect(1002, 488, 103, 135)],
    lamps: [{ x: 244, y: 295, r: 143 }, { x: 610, y: 548, r: 140 }, { x: 1030, y: 410, r: 146 }],
    guards: [guard([[274, 548], [274, 280], [100, 280], [100, 510]], 60, 1.5, -1.57), guard([[416, 378], [610, 378], [610, 596], [416, 596]], 76, 1.2, 0), guard([[754, 384], [1168, 384], [1168, 174], [754, 174]], 59, 1.8, 0)],
    intel: [{ x: 108, y: 174 }, { x: 414, y: 596 }, { x: 758, y: 208 }, { x: 1168, y: 170 }],
  },
  {
    name: 'The Vault Yard', district: '03 / THE SILENT ARCHIVE',
    briefing: 'The archive is awake. Cross the patrol lanes and carry the truth out of the city.',
    start: { x: 88, y: 600 }, exit: rect(1174, 151, 64, 87), required: 3, pebbles: 2,
    walls: [rect(24, 112, 1232, 18), rect(24, 656, 1232, 18), rect(24, 130, 18, 526), rect(1238, 130, 18, 526), rect(350, 304, 185, 30), rect(705, 300, 184, 30), rect(604, 410, 30, 168)],
    crates: [rect(210, 454, 86, 84), rect(250, 192, 92, 64), rect(474, 490, 76, 76), rect(774, 494, 93, 67), rect(1024, 270, 102, 86), rect(974, 532, 73, 73)],
    bushes: [rect(62, 544, 122, 88), rect(78, 164, 108, 123), rect(390, 369, 100, 86), rect(543, 147, 100, 80), rect(920, 373, 85, 91), rect(1116, 538, 101, 94)],
    lamps: [{ x: 370, y: 530, r: 132 }, { x: 620, y: 296, r: 150 }, { x: 930, y: 196, r: 131 }, { x: 1094, y: 474, r: 140 }],
    guards: [guard([[184, 374], [320, 374], [320, 602], [184, 602]], 65, 1.3, 0), guard([[406, 256], [680, 256], [680, 166], [406, 166]], 66, 1.6, 0), guard([[670, 386], [920, 386], [920, 602], [670, 602]], 74, 1.1, 0), guard([[960, 242], [1172, 242], [1172, 500], [960, 500]], 70, 1.3, 1.57)],
    intel: [{ x: 118, y: 184 }, { x: 440, y: 408 }, { x: 590, y: 181 }, { x: 710, y: 595 }, { x: 1170, y: 600 }],
  },
];
