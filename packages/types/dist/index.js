"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Export Supabase client und base types
__exportStar(require("./supabase"), exports);
// Export context type
__exportStar(require("./context"), exports);
// Achtung: Hier exportieren wir keine Typen mit *, da es zu Konflikten führen kann
// Stattdessen solltest du alle benötigten Typen explizit importieren und umbenennen
// Export realtime types (replacing PubSub)
__exportStar(require("./realtime"), exports);
