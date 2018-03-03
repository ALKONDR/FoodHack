export default class FoodSet {
    constructor() {
        this.sets = require('./all-food').content;
        this.products = require('./goods').content;

        this.favouriteProducts = [];
        this.hatedProducts = []
    }

    addFavouriteProduct(product) {
        this.favouriteProducts.add(product);
    }

    addHatedProduct(product) {
        this.hatedProducts.add(product);
    }

    removeFavouriteProduct(product) {
        this.favouriteProducts.splice(this.favouriteProducts.indexOf(product), 1);
    }

    removeHatedProduct(product) {
        this.hatedProducts.splice(this.hatedProducts.indexOf(product), 1);
    }

    getSet() {
        const goodSets = [];

        this.sets.forEach(set => {
            let counter = 0;

            this.hatedProducts.forEach(prod => {
                set.content.forEach(cont => {
                    if (cont.ingredients.includes(prod)) {
                        counter++;
                    }
                });
            });

            if (counter === 0) {
                goodSets.add(set);
            }
        });


        goodSets.forEach((set, index) => {
            let counter = 0;

            this.favouriteProducts.forEach(prod => {
                set.content.forEach(cont => {
                    if (cont.ingredients.includes(prod)) {
                        counter++;
                    }
                });
            });

            goodSets[index].favCount = counter;
        });

        goodSets.sort((a, b) => b.favCount - a.favCount);

        return goodSets[0];
    }
}