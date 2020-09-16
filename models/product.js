const mongoose = require("mongoose");
const {
    ObjectId
} = mongoose.Schema;

const productSchema = mongoose.Schema({
    writer: {
        type: ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        maxlength: 50
    },
    brand: {
        type: String,
        maxlength: 50
    },

    short_description: {
        type: String

    },
    description: {
        type: String
    },
    price: {
        type: Number,
        default: 0
    },
    images: {
        type: Array,
        default: []
    },
    category: {
        type: ObjectId,
        ref: "Category",
        required: true
    },
    quantity: {
        type: Number
    },


}, {
    timestamps: true
})


productSchema.index({
    title: 'text',
    description: 'text',
}, {
    weights: {
        name: 5,
        description: 1,
    }
})

module.exports = mongoose.model("Product", productSchema);