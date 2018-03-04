const Markup = require('telegraf/markup');

module.exports = function addPayment(bot) {
    const replyOptions = Markup.inlineKeyboard([
        Markup.payButton('💸 Купить'),
    ]).extra();

    const invoice = {
        provider_token: '381764678:TEST:4685',
        start_parameter: 'time-machine-sku',
        title: 'Working Time Machine',
        description: 'Вкуснейший набор еды от Партии еды',
        currency: 'RUB',
        photo_url: 'https://storage.partiyaedi.ru/images/v9isei2o8z.jpg',
        is_flexible: true,
        prices: [
            {label: 'Working Time Machine', amount: 100000},
            {label: 'Gift wrapping', amount: 100000}
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

    bot.start(({replyWithInvoice}) => replyWithInvoice(invoice));
    bot.command('/buy', ({replyWithInvoice}) => replyWithInvoice(invoice, replyOptions));
    bot.on('shipping_query', ({answerShippingQuery}) => answerShippingQuery(true, shippingOptions));
    bot.on('pre_checkout_query', ({answerPreCheckoutQuery}) => answerPreCheckoutQuery(true));
    bot.on('successful_payment', () => console.log('Woohoo'));
};
