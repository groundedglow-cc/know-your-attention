// Layout catalog transcribed from the supplied booklet photos (questions 9–39).
// These are intentionally separate from the playable `levels` list: later pages
// introduce several fixed machine pieces and pre-filled pipes, which need the
// multi-endpoint rules before they can be enabled safely.
const q = (id, size, fixed, source) => ({ id, size, fixed, source });
const stop = (...indices) => Object.fromEntries(indices.map(index => [index, { type: 'stop' }]));
const merge = (...parts) => Object.assign({}, ...parts);
const item = (type, direction) => direction === undefined ? { type } : { type, direction };

export const bookletLayouts = [
 q(9,3,merge({2:item('lion')},{4:item('prefilledCross',0)},{6:item('stop')},{8:item('yellowJar')}),'IMG_3708.HEIC'),
 q(10,3,merge({0:item('child')},{3:item('lion')},{4:item('stop')},{6:item('yellowJar')},{8:item('blueJar')}),'IMG_3708.HEIC'),
 q(11,3,merge({0:item('lion')},{2:item('child')},{4:item('prefilledCorner',1)},{6:item('yellowJar')},{8:item('blueJar')}),'IMG_3708.HEIC'),
 q(12,3,merge({0:item('lion')},{1:item('child')},{2:item('stop')},{6:item('blueJar')},{8:item('yellowJar')}),'IMG_3708.HEIC'),

 q(13,4,merge({0:item('child')},{9:item('stop')},{10:item('blueJar')}),'IMG_3709.HEIC'),
 q(14,4,merge({2:item('child')},{3:item('blueJar')}),'IMG_3709.HEIC'),
 q(15,4,merge({3:item('stop')},{5:item('stop')},{7:item('child')},{11:item('blueJar')}),'IMG_3709.HEIC'),
 q(16,4,merge({0:item('child')},{9:item('stop')},{10:item('stop')},{11:item('blueJar')}),'IMG_3709.HEIC'),

 q(17,4,merge({0:item('stop')},{1:item('yellowJar')},{4:item('stop')},{5:item('lion')}),'IMG_3710.HEIC'),
 q(18,4,merge({0:item('child')},{2:item('stop')},{3:item('lion')},{4:item('stop')},{6:item('prefilledCross',0)},{8:item('yellowJar')},{11:item('blueJar')}),'IMG_3710.HEIC'),
 q(19,4,merge({0:item('child')},{2:item('stop')},{3:item('lion')},{4:item('blueJar')},{10:item('prefilledCorner',1)},{12:item('yellowJar')},{15:item('stop')}),'IMG_3710.HEIC'),
 q(20,4,merge({0:item('child')},{4:item('stop')},{8:item('stop')},{11:item('prefilledCross',0)},{12:item('blueJar')}),'IMG_3710.HEIC'),

 q(21,4,merge({0:item('stop')},{1:item('lion')},{2:item('yellowJar')},{4:item('stop')},{9:item('prefilledCross',0)},{10:item('prefilledCross',0)}),'IMG_3711.HEIC'),
 q(22,4,merge({0:item('child')},{3:item('lion')},{4:item('blueJar')},{6:item('prefilledCorner',1)},{9:item('prefilledCorner',1)},{10:item('prefilledCross',0)},{12:item('stop')},{15:item('yellowJar')}),'IMG_3711.HEIC'),
 q(23,4,merge({0:item('lion')},{1:item('child')},{3:item('yellowJar')},{6:item('prefilledCorner',1)},{10:item('prefilledCross',0)},{11:item('blueJar')},{12:item('stop')},{15:item('stop')}),'IMG_3711.HEIC'),
 q(24,4,merge({0:item('lion')},{1:item('blueJar')},{3:item('child')},{5:item('prefilledCross',0)},{6:item('prefilledCorner',1)},{9:item('prefilledCross',0)},{12:item('yellowJar')}),'IMG_3711.HEIC'),

 q(25,4,merge({0:item('child')},{3:item('lion')},{4:item('blueJar')},{6:item('prefilledCorner',1)},{9:item('prefilledCorner',1)},{11:item('yellowJar')},{12:item('stop')}),'IMG_3712.HEIC'),
 q(26,4,merge({0:item('blueJar')},{3:item('lion')},{8:item('yellowJar')},{10:item('prefilledCross',0)},{12:item('child')},{15:item('stop')}),'IMG_3712.HEIC'),
 q(27,5,merge({0:item('child')},{4:item('stop')},{13:item('stop')},{17:item('stop')},{12:item('blueJar')}),'IMG_3712.HEIC'),

 q(28,5,merge({0:item('yellowJar')},{3:item('lion')},{8:item('stop')},{13:item('stop')},{16:item('stop')},{17:item('stop')},{18:item('stop')}),'IMG_3713.HEIC'),
 q(29,5,merge({0:item('stop')},{5:item('child')},{11:item('blueJar')},{13:item('stop')},{14:item('stop')},{16:item('stop')}),'IMG_3713.HEIC'),
 q(30,5,merge({2:item('lion')},{4:item('yellowJar')},{7:item('stop')},{11:item('blueJar')},{12:item('stop')},{17:item('child')},{20:item('stop')}),'IMG_3714.HEIC'),
 q(31,5,merge({0:item('lion')},{1:item('stop')},{2:item('yellowJar')},{6:item('stop')},{12:item('prefilledCorner',1)},{18:item('blueJar')},{22:item('child')}),'IMG_3714.HEIC'),
 q(32,5,merge({0:item('child')},{1:item('yellowJar')},{2:item('blueJar')},{12:item('prefilledCross',0)},{14:item('stop')},{20:item('lion')}),'IMG_3715.HEIC'),
 q(33,5,merge({0:item('child')},{5:item('blueJar')},{10:item('stop')},{13:item('prefilledCross',0)},{16:item('prefilledCross',0)},{19:item('stop')},{22:item('stop')},{23:item('stop')},{24:item('stop')}),'IMG_3715.HEIC'),
 q(34,5,merge({0:item('stop')},{1:item('stop')},{5:item('lion')},{7:item('prefilledCross',0)},{9:item('yellowJar')},{12:item('stop')},{13:item('prefilledCross',0)},{14:item('prefilledCross',0)},{18:item('stop')},{19:item('prefilledCross',0)},{24:item('stop')}),'IMG_3716.HEIC'),
 q(35,5,merge({2:item('child')},{6:item('prefilledCross',0)},{10:item('stop')},{13:item('prefilledCross',0)},{15:item('stop')},{16:item('yellowJar')},{19:item('lion')},{20:item('blueJar')}),'IMG_3716.HEIC'),
 q(36,5,merge({2:item('stop')},{6:item('prefilledCross',0)},{7:item('blueJar')},{12:item('stop')},{16:item('child')},{18:item('prefilledCross',0)},{24:item('stop')}),'IMG_3717.HEIC'),
 q(37,5,merge({0:item('lion')},{1:item('stop')},{2:item('yellowJar')},{18:item('blueJar')},{22:item('child')}),'IMG_3717.HEIC'),
 q(38,5,merge({0:item('child')},{5:item('stop')},{6:item('yellowJar')},{10:item('lion')},{20:item('blueJar')}),'IMG_3718.HEIC'),
 q(39,5,merge({0:item('stop')},{3:item('stop')},{4:item('stop')},{9:item('blueJar')},{6:item('prefilledCross',0)},{7:item('prefilledCross',0)},{11:item('prefilledCross',0)},{18:item('prefilledCross',0)},{15:item('stop')},{20:item('child')},{24:item('stop')}),'IMG_3718.HEIC'),
];

export const bookletLayoutById = new Map(bookletLayouts.map(layout => [layout.id, layout]));
