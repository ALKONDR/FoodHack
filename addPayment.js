const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { enter, leave } = Stage;

const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');

module.exports = function addPayment() {
    const stage_payment = new Scene('stage_payment');

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

    stage_payment.enter(({replyWithInvoice}) => replyWithInvoice(invoice));
    // bot.command('/buy', ({replyWithInvoice}) => replyWithInvoice(invoice, replyOptions));
    stage_payment.on('shipping_query', ({answerShippingQuery}) => answerShippingQuery(true, shippingOptions));
    stage_payment.on('pre_checkout_query', ({answerPreCheckoutQuery}) => answerPreCheckoutQuery(true));
    stage_payment.on('successful_payment', () => console.log('Woohoo'));

    return stage_payment;
};
