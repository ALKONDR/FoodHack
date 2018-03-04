class FoodSet {
    constructor() {
        this.sets = require('./all-food').content;
        this.categories = require('./goods').categories;
        this.likedCategories = require('./goods').categories;

        this.hatedCategories = JSON.parse(JSON.stringify(this.likedCategories));

        this.likedCategoriesArray = Object.keys(this.likedCategories);
        this.hatedCategoriesArray = Object.keys(this.hatedCategories);

        this.favouriteProducts = [];
        this.hatedProducts = []
    }

    addFavouriteProduct(product) {
        this.favouriteProducts.push(product);
    }

    addHatedProduct(product) {
        this.hatedProducts.push(product);
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

    getLikedFoodCategories() {
        return Object.keys(this.likedCategories);
    }

    getHatedFoodCategories() {
        return Object.keys(this.hatedCategories);
    }

    getLikedCategoryFood(category) {
        return this.likedCategories[category];
    }

    getHatedCategoryFood(category) {
        return this.hatedCategories[category];
    }

    getCategoryByProduct(product) {
        for (const cat in this.categories) {
            if (this.categories[cat].indexOf(product) >= 0) {
                return cat;
            }
        }
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
                goodSets.push(set);
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
