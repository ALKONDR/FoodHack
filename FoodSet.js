class FoodSet {
    constructor() {
        this.sets = require('./all-food').content;
        this.categories = require('./goods').categories;

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

    getSetNames() {
        return this.sets.map(cont => cont.type);
    }

    getSetRecipes(set) {
        return this.sets.find(rec => rec.type === set).content;
    }

    getFoodCategories() {
        return Object.keys(this.categories);
    }

    getCategoryFood(category) {
        return this.categories[category];
    }

    getBestSet() {
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

module.exports = FoodSet;
