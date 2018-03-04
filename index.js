const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');

const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { enter, leave } = Stage

const config = require('./config');
const group = require('./orderSettings');
const FoodSet = require('./FoodSet')
const foodSet = new FoodSet();
const stage_2_menu = require('./addSetStage')();
const Order = require('./Order')
const order = new Order();

const allFood = require('./all-food');

let approve = [Markup.callbackButton('Продолжить', JSON.stringify({approve: 'true'}))];

const check = '✔';
const except = '✖'

// STAGE 1
const stage_1 = new Scene('stage_1')

function fromGroupToMD(group) {
	const arr = []
	for (const obj in group) {
		let row = [];
		for (const btn in group[obj]) {
			row.push(Markup.callbackButton(group[`${obj}`][`${btn}`]['text'], group[`${obj}`][`${btn}`]['data']));
		}
		arr.push(row)
		row = [];
	}
	arr.push(approve)
	return arr;
}

function checkAnother(row, newCheck) {
	for (const obj in row) {
		let text = row[`${obj}`].text;
		if (text.startsWith(check)) {
            text = text.substring(1);
		}
        row[`${obj}`].text = text;
	}
	row[newCheck].text = check + row[newCheck].text;
	return row;
}

stage_1.enter((ctx) => {
        return ctx.reply('Я помогу тебе определиться с ужином😉: собери его по любимым/нелюбимым продуктам, и я сэкономлю твое время🕑 и подберу твой идеальный набор для прекрасного вечера🔥',
            Markup.inlineKeyboard(fromGroupToMD(group))
                .extra()
        )
    }
);

stage_1.on('callback_query', async (ctx, next) => {
	data = JSON.parse(ctx.update.callback_query.data);
	if (data.approve !== undefined) {
        await ctx.scene.leave();
        await ctx.scene.enter('stage_2');
	} else {
		if (!group[data.group][data.data].text.startsWith(check)) {
			if (data.group === 'DinnerSetting') {
				order.numberOfDays = data.data;
			} else if (data.group === 'PersonsSetting') {
				order.numberOfPeople = data.data;
			} else {
			    order.orderDay = data.data;
            }
            group[data.group] = await checkAnother(group[data.group], data.data);
            return ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard(fromGroupToMD(group))
            );
		} else {
			return ctx;
		}
	}
});

// STAGE 2
const stage_2 = new Scene('stage_2')

stage_2.enter(async (ctx) => {
	await ctx.reply('Молодец! Если ты уверен, что хочешь заказать, то можешь пройти в пункт меню.📔 Если ты хочешь поэксперементировать и найти свой идеальный ужин, то составь меню сам✏️📋');
	await ctx.reply('Из меню или под себя',
        Markup.inlineKeyboard([
        	[Markup.callbackButton('Выбрать набор из меню⚡️', 'fromMenu')],
			[Markup.callbackButton('Составь меню под себя🔥', 'selectSet')]
		])
            .extra()
    )
});

stage_2.action('fromMenu', async (ctx) => {
    await ctx.scene.leave();
    await ctx.scene.enter('stage_2_menu')
})

stage_2.action('selectSet', async (ctx, next) => {
	await ctx.scene.leave();
	await ctx.scene.enter('stage_2_1')
});

// STAGE 2_1
const stage_2_1 = new Scene('stage_2_1');
stage_2_1.enter(async (ctx) => {
    await ctx.reply('А теперь важная миссия!💪 Собери свой идеальный набор😋');
    await ctx.reply('Добавь продукты, которые тебе нравятся😎, или пропусти этот пункт😢',
        Markup.inlineKeyboard([
            [Markup.callbackButton('Добавить любимые😍😍😍', 'addFav')],
            [Markup.callbackButton('Продолжить🔜', 'add2Hate')]
        ])
            .extra()
    )
});

function categories2MD(cats) {
	const arr = []
	let flag = true;
	let row = [];
	for (const cat of cats) {
		row.push(Markup.callbackButton(cat, cat));
		if (row.length == 3 && flag) {
			arr.push(row);
			row = [];
			flag = false;
		} else if (row.length == 2 && !flag) {
            arr.push(row);
            row = [];
            flag = true;
		}
	}
	if (row.length !== 0) {
		arr.push(row);
	}
    arr.push([Markup.callbackButton('Идем дальше', 'add2Hate')]);
	return arr;
}

stage_2_1.action('addFav', async (ctx) => {
    await ctx.reply('Выбери категорию продуктов, которые вам нравится:',
        Markup.inlineKeyboard(categories2MD(foodSet.likedCategoriesArray))
            .extra()
    )
});

stage_2_1.action('add2Hate', async (ctx) => {
    await ctx.scene.leave();
	await ctx.scene.enter('stage_2_2')
});

function selectLikedCategory(cat) {
	if (cat.startsWith(check)) {
		foodSet.likedCategoriesArray[foodSet.likedCategoriesArray.indexOf(cat)] = foodSet.likedCategoriesArray[foodSet.likedCategoriesArray.indexOf(cat)].substring(1);
	} else {
        foodSet.likedCategoriesArray[foodSet.likedCategoriesArray.indexOf(cat)] = check + foodSet.likedCategoriesArray[foodSet.likedCategoriesArray.indexOf(cat)];
	}
}

function products2MD(products) {
	const arr = [];
	let flag = true;
	let row = [];
	if (products === undefined) {
	    return []
    }
	for (const prod of products) {
		if (foodSet.favouriteProducts.find(k => k === prod) !== undefined) {
			row.push(Markup.callbackButton(check + prod, prod));
		} else {
            row.push(Markup.callbackButton(prod, prod));
		}
        if (row.length == 3 && flag) {
            arr.push(row);
            row = [];
            flag = false;
        } else if (row.length == 2 && !flag) {
            arr.push(row);
            row = [];
            flag = true;
        }
	}
    if (row.length !== 0) {
        arr.push(row);
    }
    arr.push([Markup.callbackButton('Вернуться к категориям', 'return2Cats')]);
    return arr;
}

stage_2_1.on('callback_query', async (ctx) => {
	if(foodSet.likedCategoriesArray.find(text => text === ctx.update.callback_query.data) !== undefined) {
		await selectLikedCategory(ctx.update.callback_query.data);
		const prds = await products2MD(foodSet.getLikedCategoryFood(ctx.update.callback_query.data));
		await ctx.editMessageText('Выберите любимые продукты: ',
			{reply_markup: { inline_keyboard: prds}}
		);
	} else if (ctx.update.callback_query.data === 'return2Cats' ) {
		await ctx.editMessageReplyMarkup(
        	Markup.inlineKeyboard(categories2MD(foodSet.likedCategoriesArray))
		);
	} else {
		const prod = ctx.update.callback_query.data;
		if (foodSet.favouriteProducts.find(k => k === prod) === undefined) {
			foodSet.addFavouriteProduct(prod);
		} else {
			foodSet.removeFavouriteProduct(prod);
		}
        const prds = await products2MD(foodSet.getLikedCategoryFood(foodSet.getCategoryByProduct(prod)));
        await ctx.editMessageText('Выберите любимые продукты: ',
            {reply_markup: { inline_keyboard: prds}}
        );
	}
});

// STAGE 2_2
const stage_2_2 = new Scene('stage_2_2');
stage_2_2.enter(async (ctx) => {
    await ctx.reply('Теперь подумай, какие продукты ты не хочешь видеть в своем ужине😑');
    await ctx.reply('Убери нелюбимые💩 продукты из своего ужина',
        Markup.inlineKeyboard([
            [Markup.callbackButton('Исключить нелюбимые', 'addHate')],
            [Markup.callbackButton('Без учета нелюбимых продуктов', 'toSetPersonal')]
        ])
            .extra()
    )
});

function categories2MDh(cats) {
    const arr = []
    let flag = true;
    let row = [];
    for (const cat of cats) {
        row.push(Markup.callbackButton(cat, cat));
        if (row.length == 3 && flag) {
            arr.push(row);
            row = [];
            flag = false;
        } else if (row.length == 2 && !flag) {
            arr.push(row);
            row = [];
            flag = true;
        }
    }
    if (row.length !== 0) {
        arr.push(row);
    }
    arr.push([Markup.callbackButton('Идем дальше', 'toSetPersonal')]);
    return arr;
}

stage_2_2.action('addHate', async (ctx) => {
    await ctx.reply('Выбери категорию продуктов, которые вам НЕ нравится:🙊',
        Markup.inlineKeyboard(categories2MDh(foodSet.hatedCategoriesArray))
            .extra()
    )
});

stage_2_2.action('toSetPersonal', async (ctx) => {
    await ctx.scene.leave();
    await ctx.scene.enter('stage_3')
});

function selectHatedCategory(cat) {
    if (cat.startsWith(check)) {
        foodSet.hatedCategoriesArray[foodSet.hatedCategoriesArray.indexOf(cat)] = foodSet.hatedCategoriesArray[foodSet.hatedCategoriesArray.indexOf(cat)].substring(1);
    } else {
        foodSet.hatedCategoriesArray[foodSet.hatedCategoriesArray.indexOf(cat)] = except + foodSet.hatedCategoriesArray[foodSet.hatedCategoriesArray.indexOf(cat)];
    }
}

function products2MDh(products) {
    const arr = [];
    let flag = true;
    let row = [];
    if (products === undefined) {
    	return [];
	}
    for (const prod of products) {
        if (foodSet.hatedProducts.find(k => k === prod) !== undefined) {
            row.push(Markup.callbackButton(except + prod, prod));
        } else {
            row.push(Markup.callbackButton(prod, prod));
        }
        if (row.length == 3 && flag) {
            arr.push(row);
            row = [];
            flag = false;
        } else if (row.length == 2 && !flag) {
            arr.push(row);
            row = [];
            flag = true;
        }
    }
    if (row.length !== 0) {
        arr.push(row);
    }
    arr.push([Markup.callbackButton('Вернуться к категориям', 'return2Cats')]);
    return arr;
}

stage_2_2.on('callback_query', async (ctx) => {
    if(foodSet.hatedCategoriesArray.find(text => text === ctx.update.callback_query.data) !== undefined) {
        await selectHatedCategory(ctx.update.callback_query.data);
        const prds = await products2MDh(foodSet.getHatedCategoryFood(ctx.update.callback_query.data));
        await ctx.editMessageText('Выберите нелюбимые продукты: ',
            {reply_markup: { inline_keyboard: prds}}
        );
    } else if (ctx.update.callback_query.data === 'return2Cats' ) {
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(categories2MDh(foodSet.hatedCategoriesArray))
        );
    } else {
        const prod = ctx.update.callback_query.data;
        if (foodSet.hatedProducts.find(k => k === prod) === undefined) {
            foodSet.addHatedProduct(prod);
        } else {
            foodSet.removeHatedProduct(prod);
        }
        const prds = await products2MDh(foodSet.getHatedCategoryFood(foodSet.getCategoryByProduct(prod)));
        await ctx.editMessageText('Выберите нелюбимые продукты: ',
            {reply_markup: { inline_keyboard: prds}}
        );
    }
});

// STAGE 3
const stage_3 = new Scene('stage_3');

let globalPrice = 365600;
let globalSetType = 'Classic';

stage_3.enter((ctx) => {
	const bestSet = foodSet.getBestSet();
	let to_write = bestSet.type + '\n\n';
	to_write += bestSet.content.slice(0, order.numberOfDays).map(rec => `${rec.name}`).join('\n\n');
    let price = allFood.content.find(c => c.type === bestSet.type).price[order.numberOfDays][order.numberOfPeople];
    invoice.prices[0].amount = price;
    console.log('globalPrice: ', globalPrice);
    invoice.description = bestSet.type;
    console.log('globalType: ', globalSetType);
	price = String(price).substring(0, String(price).length - 2);
	to_write += '\n\n Цена: ' + price + ' руб\n';
	ctx.reply(`Ну вот и все! Мы подобрали тебе подходящий набор ужинов по твоим предпочтениям! Посмотри его 😀😘 \n\n\n ${to_write} \n\n${bestSet.telegraph}`,
        Markup.inlineKeyboard([
            [Markup.callbackButton('Заказать!', 'makeOrder'),
            Markup.callbackButton('Поменять набор', 'changeOrderSet')]
        ])
            .extra()
	);
});

stage_3.action('changeOrderSet', async (ctx) => {
    await ctx.scene.leave();
    await ctx.scene.enter('stage_2_menu');
});

stage_3.action('makeOrder', async (ctx) => {
    await ctx.scene.leave();
    await ctx.scene.enter('stage_4')
})

// STAGE 4
const stage_4 = new Scene('stage_4');
stage_4.enter(async (ctx) => {
    await ctx.reply('Как я могу с тобой связаться, чтобы доставить вкусняшку? 😏',
        Extra.markup((markup) => {
        return markup.resize()
            .keyboard([
                markup.contactRequestButton('Отправить контакт')
            ])
    }))
})

stage_4.on('message', async (ctx) => {
    await ctx.scene.leave();
    await ctx.scene.enter('stage_5')
})

// Stage 5
const stage_5 = new Scene('stage_5');
stage_5.enter(async (ctx) => {
    await ctx.reply('Куда мне подъехать?',
        Extra.markup((markup) => {
            return markup.resize()
                .keyboard([
                    markup.locationRequestButton('Определить геолокацию')
                ])
        }))
})

stage_5.on('message', async (ctx) => {
    await  ctx.reply(`Перейти к оплате`);
    await ctx.scene.leave();
    await ctx.scene.enter('stage_payment')
})

// STAGE 6
const stage_payment = new Scene('stage_payment');

const replyOptions = Markup.inlineKeyboard([
    Markup.payButton('💸 Купить'),
]).extra();

const invoice = {
    provider_token: '381764678:TEST:4702',
    start_parameter: 'partiya-edi-nabor',
    title: 'Вкуснейший набор от Партии еды',
    description: "Классическое",
    currency: 'RUB',
    photo_url: 'https://storage.partiyaedi.ru/images/v9isei2o8z.jpg',
    is_flexible: true,
    prices: [
        {label: 'Вкуснейший набор от Партии еды', amount: 365600}
    ],
    payload: {
        coupon: 'BLACK FRIDAY'
    }
};

const shippingOptions = [
    {
        id: 'Tinkoff',
        title: 'Tinkoff Bank',
        prices: [{label: 'Tinkoff', amount: 2000}]
    }
];

stage_payment.enter(({replyWithInvoice}) => replyWithInvoice(invoice));
stage_payment.on('shipping_query', ({answerShippingQuery}) => answerShippingQuery(true, shippingOptions));
stage_payment.on('pre_checkout_query', ({answerPreCheckoutQuery}) => answerPreCheckoutQuery(true));
stage_payment.on('successful_payment', () => console.log('Woohoo'));

// ------------------------------------------------------------
// Bot settings
const bot = new Telegraf(config.token);

const stage = new Stage([
    stage_1, stage_2, stage_2_menu, stage_2_1, stage_2_2, stage_3, stage_4, stage_5, stage_payment
], { ttl: 10 })
bot.use(session())
bot.use(stage.middleware())

bot.command('start', enter('stage_1'));

bot.startPolling()

module.exports = stage_4;