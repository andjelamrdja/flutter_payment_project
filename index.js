const express = require('express')
const app = express();
const cors = require('cors');
const port = 3003
const Stripe = require("stripe");
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const stripeRouter = require("./routes/stripe");
const bodyParser = require('body-parser');
const Order = require('./models/Orders')
const admin = require("firebase-admin");
// const { updateRestaurant } = require('./utils/driver_update');
const { fireBaseConnection } = require('./utils/fbConnect');

dotenv.config()

fireBaseConnection();
const stripe = Stripe(process.env.STRIPE_SECRET);
mongoose.connect(process.env.MONGO_URL).then(() => console.log("db connected")).catch((err) => console.log(err));


const endpointSecret = "whsec_rfeobTMtxLVOtlEcD11qCi79QIg007EU";


app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      paymentIntentSucceeded = event.data.object;
      break;

    case 'checkout.session.completed':
      const checkoutData = event.data.object;
      console.log("Session Completed");
      stripe.customers
        .retrieve(checkoutData.customer)
        .then(async (customer) => {
          try {
            const data = JSON.parse(customer.metadata.cart);

            const products = data.map((item) => {
              return {
                name: item.name,
                id: item.id,
                price: item.price,
                quantity: item.quantity,
                restaurantId: item.restaurantId
              };
            });

           console.log( products[0].id);

           const updatedOrder = await Order.findByIdAndUpdate(products[0].id, { paymentStatus: 'Completed' },  { new: true });
           if (updatedOrder) {
            const db = admin.database();
            const status = "Placed";
            //  updateRestaurant(updatedOrder, db ,status )
            
           } else {
            console.log("Order not found");
           }
          } catch (err) {
            console.log(err.message);
          }
        })
        .catch((err) => console.log(err.message));
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use("/stripe", stripeRouter);

app.listen(process.env.PORT || port, () => console.log(`App listening on port ${process.env.PORT}!`))