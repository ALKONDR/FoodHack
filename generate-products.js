// import resepies from './all-food';
const recipes = require('./all-food');

const fs = require('fs');
const goods = {};

let counter = 0;

recipes.content.forEach(rec => rec.content.forEach(con => {
    con.ingredients.split('\n').forEach(ing => {
        goods[ing.trim().split(':')[0]] = 1;
        counter++;
    })
}));

console.log(Object.keys(goods).length);
console.log(counter);

const ans = {content: Object.keys(goods)};

fs.writeFileSync('goods.json', JSON.stringify(ans));