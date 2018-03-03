const recipes = require('./all-food');

export function getSetNames() {
    return recipes.content.map(cont => cont.type);
}

export function getSetRecipes(set) {
    return recipes.content.find(rec => rec.type === set).content;
}
