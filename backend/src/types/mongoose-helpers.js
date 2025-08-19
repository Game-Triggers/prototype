"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMongooseDocument = isMongooseDocument;
exports.ensureDocument = ensureDocument;
// Type guard to check if an object is a Mongoose document
function isMongooseDocument(obj) {
    return (obj &&
        typeof obj === 'object' &&
        obj._id &&
        obj.save &&
        typeof obj.save === 'function');
}
// Helper function to safely access document properties
function ensureDocument(doc) {
    return doc;
}
//# sourceMappingURL=mongoose-helpers.js.map